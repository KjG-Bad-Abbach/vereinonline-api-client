# VereinOnline-API-Client

TypeScript reusable API client for VereinOnline.

## Features

This API client provides a reusable TypeScript interface for interacting with
the VereinOnline API. It includes the following modules:

### `ApiClient`

- Manages authentication and API requests.
- Provides methods for logging in, logging out, and fetching data from the API.
- Acts as a central hub for accessing the `MembersApi` and `GroupsApi`.

### `MembersApi`

- Fetch members by search term, role, group, or other filters.
- Retrieve detailed information about a specific member by their ID.
- Update member information with partial updates.

### `GroupsApi`

- Fetch a list of groups from the API.

### Key Features

- Strongly typed interfaces for `Member` and `Group` objects.
- Flexible query options for filtering and sorting.
- Built-in error handling for API responses.

## Usage

### Using Deno

To use this module in your Deno project, import it directly from the module's
URL:

```ts
import { ApiClient } from "jsr:@kjg-bad-abbach/vereinonline-api-client";

const client = new ApiClient("https://www.vereinonline.org/IHRVEREIN/");

async function main() {
  await client.login("username", "password");

  // Fetch members
  const members = await client.members.get({ searchTerm: "John" });
  console.log(members);

  // Fetch groups
  const groups = await client.groups.get();
  console.log(groups);

  // Update a member
  const updatedMember = await client.members.update("123", { vorname: "Jane" });
  console.log(updatedMember);

  client.logout();
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main().catch(console.error);
}
```

### Using npm

To use this module in a Node.js project, install it via npm:

```bash
npm install jsr:@kjg-bad-abbach/vereinonline-api-client
```

Then, import it in your JavaScript or TypeScript file:

```ts
import { ApiClient } from "@kjg-bad-abbach/vereinonline-api-client";

const client = new ApiClient("https://www.vereinonline.org/IHRVEREIN/");

async function main() {
  await client.login("username", "password");

  // Fetch members
  const members = await client.members.get({ searchTerm: "John" });
  console.log(members);

  // Fetch groups
  const groups = await client.groups.get();
  console.log(groups);

  // Update a member
  const updatedMember = await client.members.update("123", { vorname: "Jane" });
  console.log(updatedMember);

  client.logout();
}

main().catch(console.error);
```
