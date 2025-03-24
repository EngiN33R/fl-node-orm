// src/index.test.ts
import { convertXmlToMarkdown, convertMarkdownToXml } from "../src/rdltomd";

describe("convertXmlToMarkdown", () => {
  test("should convert XML with text formatting to Markdown", () => {
    const xml = `
      <RDL>
        <PUSH/>
        <TRA bold="true"/>
        <TEXT>BRETONIA</TEXT>
        <PARA/>
        <TRA italic="true"/>
        <TEXT>(BORDER WORLDS JURISDICTION)</TEXT>
        <TRA italic="false"/>
        <PARA/>
        <PARA/>
        <TRA underline="true"/>
        <TEXT>Settled Planets</TEXT>
        <TRA bold="false" underline="false"/>
        <PARA/>
        <TEXT>None</TEXT>
        <PARA/>
        <PARA/>
        <TRA bold="true" underline="true"/>
        <TEXT>Bases</TEXT>
        <TRA bold="false" underline="false"/>
        <PARA/>
        <TEXT>Russell Station</TEXT>
        <PARA/>
        <PARA/>
        <TRA bold="true" underline="true"/>
        <TEXT>Corporations</TEXT>
        <TRA bold="false" underline="false"/>
        <PARA/>
        <TEXT>Bretonia Mining and Metal</TEXT>
        <PARA/>
        <PARA/>
        <TRA bold="true" underline="true"/>
        <TEXT>Criminals</TEXT>
        <TRA bold="false" underline="false"/>
        <PARA/>
        <TEXT>Mollys</TEXT>
        <PARA/>
        <PARA/>
        <TRA bold="true" underline="true"/>
        <TEXT>Produces</TEXT>
        <TRA bold="false" underline="false"/>
        <PARA/>
        <TEXT>Platinoids</TEXT>
        <PARA/>
        <POP/>
      </RDL>
    `;

    const expected = `**BRETONIA**
***(BORDER WORLDS JURISDICTION)***

**__Settled Planets__**
None

**__Bases__**
Russell Station

**__Corporations__**
Bretonia Mining and Metal

**__Criminals__**
Mollys

**__Produces__**
Platinoids`;

    expect(convertXmlToMarkdown(xml)).toBe(expected);
  });

  test("should handle nested formatting correctly", () => {
    const xml = `
      <RDL>
        <PUSH/>
        <TRA bold="true" italic="true" underline="true"/>
        <TEXT>All Formats</TEXT>
        <PARA/>
        <TRA bold="true" italic="true" underline="false"/>
        <TEXT>Bold and Italic</TEXT>
        <PARA/>
        <TRA bold="true" italic="false" underline="true"/>
        <TEXT>Bold and Underline</TEXT>
        <PARA/>
        <TRA bold="false" italic="true" underline="true"/>
        <TEXT>Italic and Underline</TEXT>
        <POP/>
      </RDL>
    `;

    const expected = `***__All Formats__***
***Bold and Italic***
**__Bold and Underline__**
*__Italic and Underline__*`;

    expect(convertXmlToMarkdown(xml)).toBe(expected);
  });

  test("should handle PUSH and POP correctly", () => {
    const xml = `
      <RDL>
        <PUSH/>
        <TRA bold="true"/>
        <TEXT>Bold text</TEXT>
        <PARA/>
        <PUSH/>
        <TRA italic="true"/>
        <TEXT>Bold and italic text</TEXT>
        <PARA/>
        <POP/>
        <TEXT>Back to just bold</TEXT>
        <PARA/>
        <POP/>
        <TEXT>Plain text</TEXT>
      </RDL>
    `;

    const expected = `**Bold text**
***Bold and italic text***
**Back to just bold**
Plain text`;

    expect(convertXmlToMarkdown(xml)).toBe(expected);
  });

  test("should handle errors gracefully", () => {
    const invalidXml = "<invalid>";

    expect(() => {
      convertXmlToMarkdown(invalidXml);
    }).toThrow(/Failed to parse XML/);
  });
});

describe("convertMarkdownToXml", () => {
  test("should convert Markdown text with formatting to XML", () => {
    const markdown = `**BRETONIA**
*(BORDER WORLDS JURISDICTION)*

__Settled Planets__
None

**__Bases__**
Russell Station`;

    const xml = convertMarkdownToXml(markdown);

    // Convert back to verify roundtrip conversion
    const backToMarkdown = convertXmlToMarkdown(xml);

    expect(backToMarkdown).toBe(markdown);
  });

  test("should handle nested formatting correctly", () => {
    const markdown = `***Bold and Italic***
**__Bold and Underline__**
*__Italic and Underline__*`;

    const xml = convertMarkdownToXml(markdown);

    // Convert back to verify roundtrip conversion
    const backToMarkdown = convertXmlToMarkdown(xml);

    expect(backToMarkdown).toBe(markdown);
  });

  test("should handle empty paragraphs", () => {
    const markdown = `Paragraph 1
Paragraph 2`;

    const xml = convertMarkdownToXml(markdown);
    const expected =
      "<RDL><PUSH/><TEXT>Paragraph 1</TEXT><PARA/><TEXT>Paragraph 2</TEXT><POP/></RDL>";

    expect(xml).toBe(expected);
  });
});
