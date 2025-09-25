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
console.log("Testing getAll member templates...");
const allMemberTemplates = await client.templates.mails.members.getAll();
console.log("All member templates:");
console.log(allMemberTemplates);

console.log("-----------------------------");
console.log("Testing getAll event templates...");
const allEventTemplates = await client.templates.mails.events.getAll();
console.log("All event templates:");
console.log(allEventTemplates);

console.log("-----------------------------");
console.log("Testing getAll vote templates...");
const allVoteTemplates = await client.templates.mails.votes.getAll();
console.log("All vote templates:");
console.log(allVoteTemplates);

console.log("-----------------------------");
console.log("Testing getAll convention templates...");
const allConventionTemplates = await client.templates.mails.conventions
  .getAll();
console.log("All convention templates:");
console.log(allConventionTemplates);

console.log("-----------------------------");
console.log("Testing getAll shop templates...");
const allShopTemplates = await client.templates.mails.shop.getAll();
console.log("All shop templates:");
console.log(allShopTemplates);

console.log("-----------------------------");
console.log("Testing getAll accounting templates...");
const allAccountingTemplates = await client.templates.mails.accounting.getAll();
console.log("All accounting templates:");
console.log(allAccountingTemplates);

console.log("-----------------------------");
console.log("Testing getAll reservation templates...");
const allReservationTemplates = await client.templates.mails.reservations
  .getAll();
console.log("All reservation templates:");
console.log(allReservationTemplates);

console.log("-----------------------------");
console.log("Testing getAll forum templates...");
const allForumTemplates = await client.templates.mails.forum.getAll();
console.log("All forum templates:");
console.log(allForumTemplates);

console.log("-----------------------------");
console.log("Testing getAll task templates...");
const allTaskTemplates = await client.templates.mails.tasks.getAll();
console.log("All task templates:");
console.log(allTaskTemplates);

console.log("-----------------------------");
console.log("Testing getAll file templates...");
const allFileTemplates = await client.templates.mails.files.getAll();
console.log("All file templates:");
console.log(allFileTemplates);

console.log("-----------------------------");
console.log("Testing getAll blog templates...");
const allBlogTemplates = await client.templates.mails.blog.getAll();
console.log("All blog templates:");
console.log(allBlogTemplates);

console.log("-----------------------------");
console.log("Testing getAll doubleOptIn templates...");
const allDoubleOptInTemplates = await client.templates.mails.doubleOptIn
  .getAll();
console.log("All doubleOptIn templates:");
console.log(allDoubleOptInTemplates);

console.log("-----------------------------");
console.log("Testing getAll layout templates...");
const allLayoutTemplates = await client.templates.mails.layout.getAll();
console.log("All layout templates:");
console.log(allLayoutTemplates);

console.log("-----------------------------");
console.log("Templates fetched successfully.");
