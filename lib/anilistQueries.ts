import { gql } from "graphql-request";

export const QUERY_USER = gql`
  query ($username: String) {
    User(name: $username) {
      id
    }
  }
`;

export const QUERY_HISTORY = gql`
  query ($page: Int, $user: Int, $per_page: Int) {
    Page(page: $page, perPage: $per_page) {
      activities(userId: $user, sort: [ID_DESC]) {
        ... on ListActivity {
          status
          progress
          createdAt
          type
          likeCount
          replyCount
          siteUrl
          media {
            duration
            title {
              english
              romaji
            }
          }
        }

        ... on TextActivity {
          type
          text
          siteUrl
          likeCount
          createdAt
          replyCount
        }
      }
    }
  }
`;
