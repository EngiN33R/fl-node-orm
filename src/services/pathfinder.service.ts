import {
  IDataContext,
  IObject,
  ISystem,
  NavigationLocation,
  NavigationWaypoint,
} from "../types";

type Flag = "NO_JUMPGATE" | "NO_JUMPHOLE" | "NO_TRADELANE";

export class PathfinderService {
  cruiseSpeed = 300;
  tradelaneSpeed = 2000;
  // Jumps are instantaneous

  constructor(private readonly ctx: IDataContext) {}

  private distance(
    a: [number, number, number],
    b: [number, number, number]
  ): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private travelTime(distance: number, speed: number): number {
    return distance / speed;
  }

  findPotentialJumps(
    fromSystem: string,
    toSystem: string,
    flags: Flag[] = []
  ): NavigationWaypoint[] {
    const sources = this.ctx
      .entity("object")
      .findAll((o) => o.system === fromSystem && o.goto?.system === toSystem);

    const result: NavigationWaypoint[] = [];
    for (const source of sources) {
      const destination = this.ctx.findByNickname(
        "object",
        source.goto?.object ?? ""
      );
      if (destination) {
        if (
          flags.includes("NO_JUMPGATE") &&
          destination.archetype === "jumpgate"
        ) {
          continue;
        }
        if (
          flags.includes("NO_JUMPHOLE") &&
          destination.archetype.includes("jumphole")
        ) {
          continue;
        }
        const fromLoc: NavigationLocation = {
          position: source.position,
          system: source.system,
          object: source.nickname,
        };
        if (source.faction) {
          fromLoc.faction = source.faction;
        }

        const toLoc: NavigationLocation = {
          position: destination.position,
          system: destination.system,
          object: destination.nickname,
        };
        if (destination.faction) {
          toLoc.faction = destination.faction;
        }

        // Jumps are instantaneous
        const jumpDistance = this.distance(fromLoc.position, toLoc.position);
        result.push({
          type: "jump",
          from: fromLoc,
          to: toLoc,
          duration: 0,
        });
      }
    }

    return result;
  }

  /**
   * Finds a path between two locations, which are coordinates in the same or
   * different systems, optionally associated with a solar.
   *
   * The path is a list of waypoints, which are one of the following types:
   * - cruise: a direct flight between two coordinates in the same system
   * - tradelane: flight between two trade lane rings, not necessarily the
   * first and last rings and possibly in reverse order
   * - jump: jump between two systems using a jump gate or jump hole, with
   * sets of coordinates serving as the entrance and exit points
   *
   * The algorithm will prefer to use tradelanes over direct flight unless the
   * `NO_TRADELANE` flag is provided.
   *
   * If the destination is in a different system, the algorithm will find the
   * quickest path to any jump gate or jump hole that leads to the destination
   * system. A jump gate or jump hole physically further away but reachable
   * more quickly using a tradelane will be preferable to a jump gate or
   * jump hole physically closer but only reachable using direct flight.
   *
   * There may be several jumps between the start and end systems.
   *
   * @param from Origin location
   * @param to Destination location
   * @param flags Optional flags to control pathfinding behavior
   * @param excludedSystems Optional list of system nicknames to exclude from paths
   * @returns
   */
  findPath(
    from: NavigationLocation,
    to: NavigationLocation,
    options: {
      flags?: Flag[];
      excludedSystems?: string[];
    } = {}
  ): NavigationWaypoint[] {
    if (from.system === to.system) {
      return this.findPathWithinSystem(from, to, options);
    } else {
      return this.findPathBetweenSystems(from, to, options);
    }
  }

  private findPathWithinSystem(
    from: NavigationLocation,
    to: NavigationLocation,
    options: {
      flags?: Flag[];
      excludedSystems?: string[];
    } = {}
  ): NavigationWaypoint[] {
    const useTradelanes = !options.flags?.includes("NO_TRADELANE");

    if (!useTradelanes) {
      const cruiseDistance = this.distance(from.position, to.position);
      return [
        {
          type: "cruise",
          from,
          to,
          duration: this.travelTime(cruiseDistance, this.cruiseSpeed),
        },
      ];
    }

    // Try to find a path using tradelanes
    const tradelanePath = this.findPathWithTradelanes(from, to);
    if (tradelanePath.length > 0) {
      return tradelanePath;
    }

    // Fall back to direct cruise
    const cruiseDistance = this.distance(from.position, to.position);
    return [
      {
        type: "cruise",
        from,
        to,
        duration: this.travelTime(cruiseDistance, this.cruiseSpeed),
      },
    ];
  }

  private findPathWithTradelanes(
    from: NavigationLocation,
    to: NavigationLocation
  ): NavigationWaypoint[] {
    const system = this.ctx.findByNickname("system", from.system) as
      | ISystem
      | undefined;
    if (!system) {
      return [];
    }

    const tradelaneRings =
      this.ctx
        .findByNickname("system", from.system)
        ?.tradelanes.flatMap((tl) =>
          tl.rings.map((ring) => ({ ...ring, tradelane: tl }))
        ) ?? [];

    if (tradelaneRings.length === 0 || system.tradelanes.length === 0) {
      return [];
    }

    // Check if direct path is faster (baseline)
    const directDistance = this.distance(from.position, to.position);
    const directTime = this.travelTime(directDistance, this.cruiseSpeed);

    // Build graph: nodes are start, end, and all tradelane rings
    type GraphNode = {
      id: string;
      position: [number, number, number];
      type: "start" | "end" | "ring";
      ring?: IObject & { tradelane: { names: [string, string] } }; // Only for ring nodes
    };

    const nodes: GraphNode[] = [
      { id: "start", position: from.position, type: "start" },
      { id: "end", position: to.position, type: "end" },
      ...tradelaneRings.map((ring) => ({
        id: ring.nickname,
        position: ring.position,
        type: "ring" as const,
        ring,
      })),
    ];

    // Build edges: cruise between all nodes, tradelane between connected rings
    type GraphEdge = {
      from: string;
      to: string;
      weight: number; // travel time
      type: "cruise" | "tradelane";
      fromIndex?: number;
      toIndex?: number;
    };

    const edges: GraphEdge[] = [];

    // Add cruise edges between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = this.distance(nodes[i].position, nodes[j].position);
        const time = this.travelTime(dist, this.cruiseSpeed);
        edges.push({
          from: nodes[i].id,
          to: nodes[j].id,
          weight: time,
          type: "cruise",
        });
        edges.push({
          from: nodes[j].id,
          to: nodes[i].id,
          weight: time,
          type: "cruise",
        });
      }
    }

    // Add tradelane edges between connected rings in the same tradelane
    for (const tl of system.tradelanes) {
      for (let i = 0; i < tl.rings.length; i++) {
        const ring = tl.rings[i];
        if (ring.nextRing) {
          const nextRing = tl.rings.find((r) => r.nickname === ring.nextRing);
          if (nextRing) {
            const dist = this.distance(ring.position, nextRing.position);
            const time = this.travelTime(dist, this.tradelaneSpeed);
            edges.push({
              from: ring.nickname,
              to: nextRing.nickname,
              weight: time,
              type: "tradelane",
              fromIndex: ring.tradelaneIndex,
              toIndex: nextRing.tradelaneIndex,
            });
          }
        }
        if (ring.prevRing) {
          const prevRing = tl.rings.find((r) => r.nickname === ring.prevRing);
          if (prevRing) {
            const dist = this.distance(ring.position, prevRing.position);
            const time = this.travelTime(dist, this.tradelaneSpeed);
            edges.push({
              from: ring.nickname,
              to: prevRing.nickname,
              weight: time,
              type: "tradelane",
              fromIndex: ring.tradelaneIndex,
              toIndex: prevRing.tradelaneIndex,
            });
          }
        }
      }
    }

    // Use Dijkstra's algorithm to find shortest path
    const path = this.dijkstra(nodes, edges, "start", "end");

    if (!path || path.length === 0) {
      return [];
    }

    // Calculate total time of the path
    // When multiple edges exist between nodes, prefer the one with minimum weight (tradelane over cruise)
    let totalTime = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const matchingEdges = edges.filter(
        (e) => e.from === path[i] && e.to === path[i + 1]
      );
      const edge = matchingEdges.reduce((min, e) =>
        e.weight < min.weight ? e : min
      );
      if (edge) {
        totalTime += edge.weight;
      }
    }

    // Only use tradelane path if it's faster than direct cruise
    if (totalTime >= directTime) {
      return [];
    }

    // Convert path to waypoints
    return this.pathToWaypoints(path, nodes, edges, from, to);
  }

  private dijkstra(
    nodes: Array<{
      id: string;
      position: [number, number, number];
      type: string;
      ring?: IObject;
    }>,
    edges: Array<{
      from: string;
      to: string;
      weight: number;
      type: string;
      fromIndex?: number;
      toIndex?: number;
    }>,
    start: string,
    end: string
  ): string[] | null {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    for (const node of nodes) {
      distances.set(node.id, Infinity);
      previous.set(node.id, null);
      unvisited.add(node.id);
    }
    distances.set(start, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current: string | null = null;
      let minDist = Infinity;
      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId) ?? Infinity;
        if (dist < minDist) {
          minDist = dist;
          current = nodeId;
        }
      }

      if (!current || minDist === Infinity) {
        break;
      }

      if (current === end) {
        // Reconstruct path
        const path: string[] = [];
        let node: string | null = end;
        while (node !== null) {
          path.unshift(node);
          node = previous.get(node) ?? null;
        }
        return path;
      }

      unvisited.delete(current);

      // Check neighbors
      for (const edge of edges) {
        if (edge.from === current && unvisited.has(edge.to)) {
          const alt = (distances.get(current) ?? Infinity) + edge.weight;
          if (alt < (distances.get(edge.to) ?? Infinity)) {
            distances.set(edge.to, alt);
            previous.set(edge.to, current);
          }
        }
      }
    }

    return null;
  }

  private pathToWaypoints(
    path: string[],
    nodes: Array<{
      id: string;
      position: [number, number, number];
      type: string;
      ring?: IObject & { tradelane: { names: [string, string] } };
    }>,
    edges: Array<{
      from: string;
      to: string;
      weight: number;
      type: string;
      fromIndex?: number;
      toIndex?: number;
    }>,
    from: NavigationLocation,
    to: NavigationLocation
  ): NavigationWaypoint[] {
    const waypoints: NavigationWaypoint[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    let i = 0;
    while (i < path.length - 1) {
      const fromId = path[i];
      const fromNode = nodeMap.get(fromId)!;

      // Get the edge for this segment
      const matchingEdges = edges.filter(
        (e) => e.from === fromId && e.to === path[i + 1]
      );
      const edge = matchingEdges.reduce((min, e) =>
        e.weight < min.weight ? e : min
      )!;

      // If this is a tradelane edge, try to combine consecutive tradelane segments
      if (edge.type === "tradelane") {
        let tradelaneEndIndex = i + 1;
        let totalTradelaneDuration = edge.weight;

        // Look ahead to find consecutive tradelane segments
        while (tradelaneEndIndex < path.length - 1) {
          const nextMatchingEdges = edges.filter(
            (e) =>
              e.from === path[tradelaneEndIndex] &&
              e.to === path[tradelaneEndIndex + 1]
          );
          const nextEdge = nextMatchingEdges.reduce((min, e) =>
            e.weight < min.weight ? e : min
          );

          if (nextEdge.type === "tradelane") {
            totalTradelaneDuration += nextEdge.weight;
            tradelaneEndIndex++;
          } else {
            break;
          }
        }

        // Create combined tradelane waypoint
        const tradelaneStartNode = nodeMap.get(fromId)!;
        const tradelaneEndNode = nodeMap.get(path[tradelaneEndIndex])!;
        const direction = Math.sign(
          (tradelaneEndNode.ring?.tradelaneIndex ?? 0) -
            (tradelaneStartNode.ring?.tradelaneIndex ?? 0)
        );

        const fromLoc: NavigationLocation = {
          position: tradelaneStartNode.position,
          system: from.system,
          name:
            direction > 0
              ? tradelaneStartNode.ring?.tradelane?.names[0]
              : tradelaneStartNode.ring?.tradelane?.names[1],
        };
        if (tradelaneStartNode.type === "start") {
          Object.assign(fromLoc, from);
        } else if (tradelaneStartNode.ring) {
          fromLoc.object = tradelaneStartNode.ring.nickname;
          if (tradelaneStartNode.ring.faction) {
            fromLoc.faction = tradelaneStartNode.ring.faction;
          }
        }

        const toLoc: NavigationLocation = {
          position: tradelaneEndNode.position,
          system: from.system,
          name:
            direction > 0
              ? tradelaneStartNode.ring?.tradelane?.names[0]
              : tradelaneStartNode.ring?.tradelane?.names[1],
        };
        if (tradelaneEndNode.type === "end") {
          Object.assign(toLoc, to);
        } else if (tradelaneEndNode.ring) {
          toLoc.object = tradelaneEndNode.ring.nickname;
          if (tradelaneEndNode.ring.faction) {
            toLoc.faction = tradelaneEndNode.ring.faction;
          }
        }

        waypoints.push({
          type: "tradelane",
          from: fromLoc,
          to: toLoc,
          duration: totalTradelaneDuration,
        });

        i = tradelaneEndIndex;
      } else {
        // Cruise segment
        const toId = path[i + 1];
        const toNode = nodeMap.get(toId)!;

        const fromLoc: NavigationLocation = {
          position: fromNode.position,
          system: from.system,
        };
        if (fromNode.type === "start") {
          Object.assign(fromLoc, from);
        } else if (fromNode.ring) {
          fromLoc.object = fromNode.ring.nickname;
          if (fromNode.ring.faction) {
            fromLoc.faction = fromNode.ring.faction;
          }
        }

        const toLoc: NavigationLocation = {
          position: toNode.position,
          system: from.system,
        };
        if (toNode.type === "end") {
          Object.assign(toLoc, to);
        } else if (toNode.ring) {
          toLoc.object = toNode.ring.nickname;
          if (toNode.ring.faction) {
            toLoc.faction = toNode.ring.faction;
          }
        }

        waypoints.push({
          type: "cruise",
          from: fromLoc,
          to: toLoc,
          duration: edge.weight,
        });

        i++;
      }
    }

    return waypoints;
  }

  private distanceToLineSegment(
    point: [number, number, number],
    lineStart: [number, number, number],
    lineEnd: [number, number, number]
  ): number {
    const dx = lineEnd[0] - lineStart[0];
    const dy = lineEnd[1] - lineStart[1];
    const dz = lineEnd[2] - lineStart[2];
    const lengthSq = dx * dx + dy * dy + dz * dz;

    if (lengthSq === 0) {
      return this.distance(point, lineStart);
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point[0] - lineStart[0]) * dx +
          (point[1] - lineStart[1]) * dy +
          (point[2] - lineStart[2]) * dz) /
          lengthSq
      )
    );

    const proj: [number, number, number] = [
      lineStart[0] + t * dx,
      lineStart[1] + t * dy,
      lineStart[2] + t * dz,
    ];

    return this.distance(point, proj);
  }

  private findNearestTradelaneRing(
    position: [number, number, number],
    tradelanes: IObject[]
  ): IObject | null {
    if (tradelanes.length === 0) {
      return null;
    }

    let nearest: IObject | null = null;
    let minDistance = Infinity;

    for (const ring of tradelanes) {
      const dist = this.distance(position, ring.position);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = ring;
      }
    }

    return nearest;
  }

  private findTradelaneChainPath(
    start: IObject,
    end: IObject,
    allRings: IObject[]
  ): IObject[] {
    // Build a map for quick lookup
    const ringMap = new Map<string, IObject>();
    for (const ring of allRings) {
      ringMap.set(ring.nickname, ring);
    }

    // Try forward direction (nextRing)
    const forwardPath = this.findPathAlongChain(
      start,
      end,
      ringMap,
      (ring) => ring.nextRing
    );
    if (forwardPath.length > 0) {
      return forwardPath;
    }

    // Try reverse direction (prevRing)
    const reversePath = this.findPathAlongChain(
      start,
      end,
      ringMap,
      (ring) => ring.prevRing
    );
    if (reversePath.length > 0) {
      return reversePath;
    }

    return [];
  }

  private findPathAlongChain(
    start: IObject,
    end: IObject,
    ringMap: Map<string, IObject>,
    getNext: (ring: IObject) => string | undefined
  ): IObject[] {
    const visited = new Set<string>();
    const path: IObject[] = [start];
    visited.add(start.nickname);

    let current: IObject | undefined = start;
    while (current) {
      if (current.nickname === end.nickname) {
        return path;
      }

      const nextNickname = getNext(current);
      if (!nextNickname) {
        break;
      }

      const next = ringMap.get(nextNickname);
      if (!next || visited.has(nextNickname)) {
        break;
      }

      path.push(next);
      visited.add(nextNickname);
      current = next;
    }

    return [];
  }

  private calculateTradelaneDistance(path: IObject[]): number {
    if (path.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += this.distance(path[i].position, path[i + 1].position);
    }
    return totalDistance;
  }

  private findPathBetweenSystems(
    from: NavigationLocation,
    to: NavigationLocation,
    options: {
      flags?: Flag[];
      excludedSystems?: string[];
    } = {}
  ): NavigationWaypoint[] {
    const { flags = [] } = options;

    // Find the shortest path through systems using BFS
    const systemPath = this.findSystemPath(from.system, to.system, options);

    if (systemPath.length === 0) {
      return [];
    }

    // Build the complete path by connecting paths through each system
    const waypoints: NavigationWaypoint[] = [];
    let currentLocation: NavigationLocation = from;

    for (let i = 0; i < systemPath.length - 1; i++) {
      const currentSystem = systemPath[i];
      const nextSystem = systemPath[i + 1];

      // Find the best jump from current system to next system
      const potentialJumps = this.findPotentialJumps(
        currentSystem,
        nextSystem,
        flags
      );

      if (potentialJumps.length === 0) {
        return [];
      }

      // Find the best jump point (quickest to reach)
      let bestJump: NavigationWaypoint | null = null;
      let bestTime = Infinity;

      for (const jump of potentialJumps) {
        // Find path to jump point
        const pathToJump = this.findPathWithinSystem(
          currentLocation,
          {
            position: jump.from.position,
            system: jump.from.system,
            object: jump.from.object,
            faction: jump.from.faction,
          },
          options
        );

        const timeToJump = this.calculatePathTime(pathToJump);

        if (timeToJump < bestTime) {
          bestTime = timeToJump;
          bestJump = jump;
        }
      }

      if (!bestJump) {
        return [];
      }

      // Path to jump point
      const pathToJump = this.findPathWithinSystem(
        currentLocation,
        {
          position: bestJump.from.position,
          system: bestJump.from.system,
          object: bestJump.from.object,
          faction: bestJump.from.faction,
        },
        options
      );
      waypoints.push(...pathToJump);

      // The jump itself
      waypoints.push(bestJump);

      // Update current location to the jump exit
      currentLocation = {
        position: bestJump.to.position,
        system: bestJump.to.system,
        object: bestJump.to.object,
        faction: bestJump.to.faction,
      };
    }

    // Path from last jump exit to final destination
    const pathFromLastJump = this.findPathWithinSystem(
      currentLocation,
      to,
      options
    );
    waypoints.push(...pathFromLastJump);

    return waypoints;
  }

  private findSystemPath(
    fromSystem: string,
    toSystem: string,
    options: {
      flags?: Flag[];
      excludedSystems?: string[];
    } = {}
  ): string[] {
    const { flags = [], excludedSystems = [] } = options;

    // If same system, return empty (handled by caller)
    if (fromSystem === toSystem) {
      return [];
    }

    // Check if start or end system is excluded
    if (
      excludedSystems.includes(fromSystem) ||
      excludedSystems.includes(toSystem)
    ) {
      return [];
    }

    // Check for direct connection first
    const directJumps = this.findPotentialJumps(fromSystem, toSystem, flags);
    if (directJumps.length > 0) {
      return [fromSystem, toSystem];
    }

    // Build a graph of system connections
    const systemGraph = this.buildSystemGraph(flags, excludedSystems);

    // Use BFS to find shortest path
    const queue: Array<{ system: string; path: string[] }> = [
      { system: fromSystem, path: [fromSystem] },
    ];
    const visited = new Set<string>([fromSystem]);

    while (queue.length > 0) {
      const { system, path } = queue.shift()!;

      const neighbors = systemGraph.get(system) || [];
      for (const neighbor of neighbors) {
        // Skip excluded systems
        if (excludedSystems.includes(neighbor)) {
          continue;
        }

        if (neighbor === toSystem) {
          return [...path, neighbor];
        }

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ system: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return [];
  }

  private buildSystemGraph(
    flags: Flag[],
    excludedSystems: string[] = []
  ): Map<string, string[]> {
    const graph = new Map<string, Set<string>>();

    // Get all systems
    const allSystems = this.ctx.entity("system").findAll();

    for (const system of allSystems) {
      // Skip excluded systems
      if (excludedSystems.includes(system.nickname)) {
        continue;
      }

      if (!graph.has(system.nickname)) {
        graph.set(system.nickname, new Set());
      }

      // Find all systems reachable from this system
      const allObjects = this.ctx
        .entity("object")
        .findAll((o) => o.system === system.nickname && o.goto !== undefined);

      for (const obj of allObjects) {
        if (!obj.goto) continue;

        // Check if this jump type is allowed
        if (flags.includes("NO_JUMPGATE") && obj.archetype === "jumpgate") {
          continue;
        }
        if (
          flags.includes("NO_JUMPHOLE") &&
          obj.archetype.includes("jumphole")
        ) {
          continue;
        }

        const targetSystem = obj.goto.system;
        // Don't add edges to excluded systems
        if (!excludedSystems.includes(targetSystem)) {
          graph.get(system.nickname)!.add(targetSystem);
        }
      }
    }

    // Convert Sets to Arrays
    const result = new Map<string, string[]>();
    for (const [system, neighbors] of graph.entries()) {
      result.set(system, Array.from(neighbors));
    }

    return result;
  }

  private calculatePathTime(waypoints: NavigationWaypoint[]): number {
    let totalTime = 0;

    for (const waypoint of waypoints) {
      const distance = this.distance(
        waypoint.from.position,
        waypoint.to.position
      );

      if (waypoint.type === "cruise") {
        totalTime += this.travelTime(distance, this.cruiseSpeed);
      } else if (waypoint.type === "tradelane") {
        totalTime += this.travelTime(distance, this.tradelaneSpeed);
      }
      // Jumps are instantaneous, so no time added
    }

    return totalTime;
  }
}
