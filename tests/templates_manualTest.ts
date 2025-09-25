import { ApiClient } from "../src/api/client.ts";
import process from "node:process";

const readonlyTest = true;
const onlyBackupIfNotExists = true;
const testTemplateName = "mailToMembersTemplate";

console.log("Testing ApiClient...");
const client = new ApiClient(
  process.env.VEREINONLINE_BASE_URL !== undefined
    ? process.env.VEREINONLINE_BASE_URL
    : (() => {
      throw new Error("VEREINONLINE_BASE_URL is not set");
    })(), // "https://www.vereinonline.org/IHRVEREIN/"
);
await client.login(
  process.env.VEREINONLINE_USER ?? "",
  process.env.VEREINONLINE_PASSWORD ?? "",
  false,
);
console.log("Login successful.");

console.log("-----------------------------");
console.log("Available template names:");
const names = await client.templates.mails.members.fetchAllTemplateNames();
console.log(names);

if (!readonlyTest) {
  console.log("-----------------------------");
  console.log("Testing get template...");
  const template = await client.templates.mails.members.get(
    testTemplateName,
  );
  if (
    !onlyBackupIfNotExists ||
    !(await Deno.stat(testTemplateName + ".json").catch(() => false))
  ) {
    await Deno.writeTextFile(
      testTemplateName + ".json",
      JSON.stringify(template, null, 2),
    );
  }
  console.log("Template fetched:");
  console.log(template);

  console.log("-----------------------------");
  console.log("Testing reset to default...");
  await client.templates.mails.members.resetToDefault(testTemplateName);
  console.log("Template reset to default.");

  console.log("-----------------------------");
  console.log("Testing set template...");
  const templateFromFile = JSON.parse(
    await Deno.readTextFile(
      testTemplateName + ".json",
    ),
  );
  console.log("Template from file:");
  console.log(templateFromFile);
  if (
    template.subject !== templateFromFile.subject ||
    template.htmlBody !== templateFromFile.htmlBody
  ) {
    console.error("Templates do not match! Will be updated.");
    await client.templates.mails.members.set(
      testTemplateName,
      templateFromFile,
    );
    console.log("Template updated from file.");
  }
}

console.log("-----------------------------");
console.log("Testing getAll templates...");
const allTemplates = await client.templates.mails.members.getAll();
console.log("All templates:");
console.log(allTemplates);

console.log("-----------------------------");
console.log("Templates fetched successfully.");
