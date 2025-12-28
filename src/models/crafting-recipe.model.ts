import { IniCraftingRecipe } from "../ini-types";
import { ICraftingRecipe, IDataContext, IIniSection } from "../types";

export class CraftingRecipeModel implements ICraftingRecipe {
  public nickname!: string;
  public type = "crafting_recipe" as const;

  public product!: {
    good: string;
    amount: number;
  };
  public ingredients!: Array<{
    good: string;
    amount: number;
  }>;
  public bases!: string[];
  public cost!: number;

  static async from(
    ctx: IDataContext,
    inputs: { recipe: IIniSection<IniCraftingRecipe> }
  ) {
    const recipe = new CraftingRecipeModel();

    const product = inputs.recipe.get("product");

    recipe.nickname = inputs.recipe.name;
    recipe.product = {
      good: product[0],
      amount: Number(product[1]),
    };
    recipe.ingredients = inputs.recipe
      .asArray("ingredient", true)
      .map(([good, amount]) => ({
        good,
        amount: Number(amount),
      }));
    recipe.bases = inputs.recipe.asArray("base_nickname");
    recipe.cost = Number(inputs.recipe.get("cost"));

    ctx.registerModel(recipe);

    return recipe;
  }
}
