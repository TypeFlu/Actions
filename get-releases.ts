// get-releases.ts

import { graphql } from "@octokit/graphql";
import * as fs from "fs";

// Define the structure of the data we expect from the GraphQL API for type safety
interface ReleaseNode {
  name: string;
  tagName: string;
  url: string;
  publishedAt: string;
}

interface GraphQLResponse {
  repository: {
    releases: {
      nodes: ReleaseNode[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
}

// Main function to run the script
async function main() {
  try {
    // --- 1. SETUP ---
    // Retrieve inputs from environment variables set by the GitHub Actions workflow
    const repoOwner = process.env.REPO_OWNER;
    const repoName = process.env.REPO_NAME;
    const token = process.env.GH_TOKEN;

    // Validate that all required environment variables are present
    if (!repoOwner || !repoName || !token) {
      throw new Error("Missing required environment variables: REPO_OWNER, REPO_NAME, or GH_TOKEN.");
    }

    const repoFullName = `${repoOwner}/${repoName}`;
    console.log(`Fetching releases for ${repoFullName} using GraphQL...`);

    // --- 2. FETCH ALL RELEASES WITH GRAPHQL PAGINATION ---
    let allReleases: ReleaseNode[] = [];
    let hasNextPage = true;
    let endCursor: string | null = null; // Start with a null cursor for the first page

    // Loop to handle pagination until all releases are fetched
    while (hasNextPage) {
      // Define the GraphQL query. We request exactly the fields we need.
      const query = `
        query GetReleases($owner: String!, $repo: String!, $cursor: String) {
          repository(owner: $owner, name: $repo) {
            releases(first: 100, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes {
                name
                tagName
                url
                publishedAt
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;

      // Execute the query using the @octokit/graphql library
      const response: GraphQLResponse = await graphql(query, {
        owner: repoOwner,
        repo: repoName,
        cursor: endCursor,
        headers: {
          authorization: `bearer ${token}`,
        },
      });

      const { nodes, pageInfo } = response.repository.releases;
      allReleases = allReleases.concat(nodes); // Add the fetched releases to our list
      hasNextPage = pageInfo.hasNextPage;     // Check if there's another page
      endCursor = pageInfo.endCursor;         // Get the cursor for the next page

      console.log(`Fetched ${nodes.length} releases. Total so far: ${allReleases.length}. Has next page: ${hasNextPage}`);
    }

    console.log(`Found a total of ${allReleases.length} releases.`);

    // --- 3. FORMAT THE MESSAGE FOR TELEGRAM ---
    let message: string;
    if (allReleases.length === 0) {
      message = `*INFO: No releases found for ${repoFullName}*`;
    } else {
      const header = `*🚀 All ${allReleases.length} Releases for ${repoFullName}*\n\n`;
      const releaseList = allReleases
        .map(release => {
          const releaseName = release.name || "Untitled Release"; // Handle releases without a name
          const tagName = release.tagName;
          const url = release.url;
          const publishedDate = release.publishedAt ? release.publishedAt.substring(0, 10) : "N/A";
          return `*-* [${releaseName} (${tagName})](${url}) - _Published on ${publishedDate}_`;
        })
        .join("\n");

      message = `${header}${releaseList}`;
    }

    // --- 4. OUTPUT THE MESSAGE ---
    // Write the final message to a file for the next workflow step to read
    fs.writeFileSync("telegram-message.txt", message);
    console.log("Successfully formatted message and saved to telegram-message.txt");

  } catch (error) {
    // Provide a clear error message if something goes wrong
    console.error("An error occurred:", error);
    fs.writeFileSync("telegram-message.txt", `*ERROR:* Failed to fetch releases using GraphQL. Please check the repository owner/name and workflow permissions.`);
    process.exit(1); // Fail the workflow step
  }
}

// Run the main function
main();
