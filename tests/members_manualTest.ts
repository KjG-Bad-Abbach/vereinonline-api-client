import { ApiClient } from "../src/api/client.ts";
import process from "node:process";

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
);
console.log("Login successful.");

console.log("Testing getMembers...");
const members = await client.members.get({
  searchTerm: "Max",
  // filter: "nachname='Mustermann'",
  fields: [
    "kvp",
    "name",
    "p_email",
    "g_email",
    "key_custom_field",
  ],
});
for (const member of members) {
  console.log(`Member ID: ${member.id}`);
  console.log(`JSON: ${JSON.stringify(member, null, 2)}`);
  console.log(`Member Name: ${member.name}`);
  console.log(`Member Email: ${member.p_email}`);
  console.log(`Member Email: ${member.g_email}`);
  console.log(`Custom Field: ${member["key_custom_field"]}`);
  console.log("-----------------------------");
}
console.log("Members fetched successfully.");

console.log("Testing getMemberById...");
const memberId = members[0].id;
const member = await client.members.getById(memberId);
console.log(`Member ID: ${member.id}`);
console.log(`JSON: ${JSON.stringify(member, null, 2)}`);
// console.log(`Member Name: ${member.name}`);
// console.log(`Member Email: ${member.email}`);
// console.log(`Custom Field: ${member["key_custom_field"]}`);
console.log("-----------------------------");
console.log("Member fetched successfully.");
