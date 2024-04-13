import {
  Box,
  Button,
  Card,
  Code,
  Container,
  Group,
  Input,
  SegmentedControl,
  Text,
  Title,
} from "@mantine/core";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import type { NextPage } from "next";
import { Line } from "react-chartjs-2";
import { useReducer, useState } from "react";
import { request, ClientError } from "graphql-request";
import { AnilistPage, AnilistUser, LocalActivity } from "../types/AnilistTypes";
import { QUERY_HISTORY, QUERY_USER } from "../lib/anilistQueries";
import ActivityHistory from "../lib/activityHistory";

const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));
const delay = 5000;


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

function reducer(
  state: { output: string },
  action: { type: string; payload?: string }
) {
  switch (action.type) {
    case "update":
      return { output: state.output + action.payload + "\n" };
    case "reset":
      return { output: "" };
    default:
      throw new Error();
  }
}

const AnilistExporter: NextPage = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [currentChart, setCurrentChart] = useState("likes");
  const [currentView, setCurrentView] = useState("perMonth");

  const [state, dispatch] = useReducer(reducer, { output: "" });

  const [likesData, setLikesData] = useState<{ id: string; count: number }[]>(
    []
  );
  const [repliesData, setRepliesData] = useState<
    { id: string; count: number }[]
  >([]);

  const [hoursData, setHoursData] = useState<{ id: string; count: number }[]>(
    []
  );

  const [chaptersData, setChaptersData] = useState<
    { id: string; count: number }[]
  >([]);

  const [episodesData, setEpisodesData] = useState<
    { id: string; count: number }[]
  >([]);

  const handleStart = async () => {
    dispatch({ type: "reset" });
    setDownloadUrl("");
    setLoading(true);
    setError("");
    setLikesData([]);
    setRepliesData([]);
    setHoursData([]);
    setChaptersData([]);
    setCurrentChart("likes");
    setCurrentView("perMonth");

    let user = {} as AnilistUser;

    try {
      dispatch({
        type: "update",
        payload: `fetching user info of ${username}`,
      });

      user = await request("https://graphql.anilist.co", QUERY_USER, {
        username: username,
      });
    } catch (e) {
      if (e instanceof ClientError) {
        dispatch({ type: "update", payload: JSON.stringify(e.response) });

        if (e.response.status === 404) {
          setError("User not found");
        } else {
          setError("An error occured");
        }
      }

      setLoading(false);
      return;
    }

    dispatch({
      type: "update",
      payload: `resolved user id to ${user.User.id}`,
    });

    dispatch({
      type: "update",
      payload: "fetching user text and list activities",
    });

    dispatch({
      type: "update",
      payload:
        `\nTHIS MIGHT TAKE A WHILE. ${delay / 1000} second delay added between each request to prevent rate limiting\n`,
    });

    // loop through all activity history pages
    const activityHistory = [] as LocalActivity[];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const history: AnilistPage = await request(
        "https://graphql.anilist.co",
        QUERY_HISTORY,
        {
          page: page,
          user: user.User.id,
          per_page: 50,
        }
      );

      console.log(history.Page.activities);

      // loop through all activities on the page
      history.Page.activities.forEach((activity) => {
        const localActivity = {} as LocalActivity;

        if (!activity.type) {
          return;
        }

        localActivity.url = activity.siteUrl;
        localActivity.replies = activity.replyCount;
        localActivity.createdAt = activity.createdAt;
        localActivity.type = activity.type;
        localActivity.likes = activity.likeCount;
        localActivity.progress = activity.progress;
        localActivity.status = activity.status;

        if (activity.text) {
          localActivity.text = activity.text;
        }

        if (activity.media) {
          localActivity.duration = activity.media.duration;

          if (activity.media.title.english) {
            localActivity.text = activity.media.title.english;
          } else {
            history;
            localActivity.text = activity.media.title.romaji;
          }
        }

        activityHistory.push(localActivity);
      });

      // check if there are more pages
      if (history.Page.activities.length < 50) {
        hasNextPage = false;
      }

      dispatch({
        type: "update",
        payload: `loaded page ${page} with ${history.Page.activities.length} activities. total cleaned ${activityHistory.length}`,
      });

      page++;
      await timer(delay);
    }

    dispatch({
      type: "update",
      payload: `completed loading activities totalling ${activityHistory.length}`,
    });

    dispatch({
      type: "update",
      payload: `generating chart datasets`,
    });

    const {
      likesPerMonth,
      repliesPerMonth,
      hoursWatched,
      chaptersRead,
      episodesWatched,
    } = ActivityHistory(activityHistory);

    setLikesData(likesPerMonth.reverse());
    setRepliesData(repliesPerMonth.reverse());
    setHoursData(hoursWatched.reverse());
    setChaptersData(chaptersRead.reverse());
    setEpisodesData(episodesWatched.reverse());

    dispatch({
      type: "update",
      payload: `chart datasets generated`,
    });

    dispatch({
      type: "update",
      payload: `generating downloadable JSON file`,
    });

    // downloadable json file
    const blob = new Blob([JSON.stringify(activityHistory)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);

    dispatch({
      type: "update",
      payload: `downloadable JSON file generated`,
    });

    dispatch({
      type: "update",
      payload: `processing completed`,
    });

    setLoading(false);
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const labels = (type: string) => {
    if (currentView === "perMonth") {
      if (type === "likes") {
        return likesData.map((item) => item.id);
      }

      if (type === "replies") {
        return repliesData.map((item) => item.id);
      }

      if (type === "hoursWatched") {
        return hoursData.map((item) => item.id);
      }

      if (type === "chaptersRead") {
        return chaptersData.map((item) => item.id);
      }

      if (type === "episodesWatched") {
        return episodesData.map((item) => item.id);
      }
    }

    if (currentView === "total") {
      if (type === "likes") {
        const totalLikes = [] as { id: string; count: number }[];
        likesData.forEach((item) => {
          if (totalLikes.length === 0) {
            totalLikes.push(item);
          } else {
            totalLikes.push({
              id: item.id,
              count: item.count + totalLikes[totalLikes.length - 1].count,
            });
          }
        });

        return totalLikes.map((item) => item.id);
      }

      if (type === "replies") {
        const totalReplies = [] as { id: string; count: number }[];
        repliesData.forEach((item) => {
          if (totalReplies.length === 0) {
            totalReplies.push(item);
          } else {
            totalReplies.push({
              id: item.id,
              count: item.count + totalReplies[totalReplies.length - 1].count,
            });
          }
        });

        return totalReplies.map((item) => item.id);
      }

      if (type === "hoursWatched") {
        const totalHours = [] as { id: string; count: number }[];
        hoursData.forEach((item) => {
          if (totalHours.length === 0) {
            totalHours.push(item);
          } else {
            totalHours.push({
              id: item.id,
              count: item.count + totalHours[totalHours.length - 1].count,
            });
          }
        });

        return totalHours.map((item) => item.id);
      }

      if (type === "chaptersRead") {
        const totalChapters = [] as { id: string; count: number }[];
        chaptersData.forEach((item) => {
          if (totalChapters.length === 0) {
            totalChapters.push(item);
          } else {
            totalChapters.push({
              id: item.id,
              count: item.count + totalChapters[totalChapters.length - 1].count,
            });
          }
        });

        return totalChapters.map((item) => item.id);
      }

      if (type === "episodesWatched") {
        const totalEpisodes = [] as { id: string; count: number }[];
        episodesData.forEach((item) => {
          if (totalEpisodes.length === 0) {
            totalEpisodes.push(item);
          } else {
            totalEpisodes.push({
              id: item.id,
              count: item.count + totalEpisodes[totalEpisodes.length - 1].count,
            });
          }
        });

        return totalEpisodes.map((item) => item.id);
      }
    }

    return [];
  };

  const dataset = (type: string) => {
    if (currentView === "perMonth") {
      if (type === "likes") {
        return likesData.map((item) => item.count);
      }

      if (type === "replies") {
        return repliesData.map((item) => item.count);
      }

      if (type === "chaptersRead") {
        return chaptersData.map((item) => item.count);
      }

      if (type === "hoursWatched") {
        return hoursData.map((item) => item.count);
      }

      if (type === "episodesWatched") {
        return episodesData.map((item) => item.count);
      }
    }

    if (currentView === "total") {
      if (type === "likes") {
        const totalLikes = [] as { id: string; count: number }[];
        likesData.forEach((item) => {
          if (totalLikes.length === 0) {
            totalLikes.push(item);
          } else {
            totalLikes.push({
              id: item.id,
              count: item.count + totalLikes[totalLikes.length - 1].count,
            });
          }
        });

        return totalLikes.map((item) => item.count);
      }

      if (type === "replies") {
        const totalReplies = [] as { id: string; count: number }[];
        repliesData.forEach((item) => {
          if (totalReplies.length === 0) {
            totalReplies.push(item);
          } else {
            totalReplies.push({
              id: item.id,
              count: item.count + totalReplies[totalReplies.length - 1].count,
            });
          }
        });

        return totalReplies.map((item) => item.count);
      }

      if (type === "hoursWatched") {
        const totalHours = [] as { id: string; count: number }[];
        hoursData.forEach((item) => {
          if (totalHours.length === 0) {
            totalHours.push(item);
          } else {
            totalHours.push({
              id: item.id,
              count: item.count + totalHours[totalHours.length - 1].count,
            });
          }
        });

        return totalHours.map((item) => item.count);
      }

      if (type === "chaptersRead") {
        const totalChapters = [] as { id: string; count: number }[];
        chaptersData.forEach((item) => {
          if (totalChapters.length === 0) {
            totalChapters.push(item);
          } else {
            totalChapters.push({
              id: item.id,
              count: item.count + totalChapters[totalChapters.length - 1].count,
            });
          }
        });

        return totalChapters.map((item) => item.count);
      }

      if (type === "episodesWatched") {
        const totalEpisodes = [] as { id: string; count: number }[];
        episodesData.forEach((item) => {
          if (totalEpisodes.length === 0) {
            totalEpisodes.push(item);
          } else {
            totalEpisodes.push({
              id: item.id,
              count: item.count + totalEpisodes[totalEpisodes.length - 1].count,
            });
          }
        });

        return totalEpisodes.map((item) => item.count);
      }
    }

    return [];
  };

  const data = {
    labels: labels(currentChart),
    datasets: [
      {
        data: dataset(currentChart),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.3,
      },
    ],
  };

  return (
    <Box>
      <Container size="lg" pt="lg">
        <Title order={2} mb="md">
          Anilist Visualizer & Exporter
        </Title>

        <Box mt={30} mb="md" pb={10}>
          <Card mb="lg">
            <Title order={4} mb="md">
              Enter Anilist username
            </Title>

            <Group>
              <Input
                variant="filled"
                placeholder="blekmus"
                size="sm"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.currentTarget.value)
                }
              />

              <Button color="gray" onClick={handleStart} loading={loading}>
                Start the magic
              </Button>
            </Group>

            {error !== "" && (
              <Text size="sm" mt="sm" c="red" fw={600}>
                {error}
              </Text>
            )}
          </Card>

          <Card mb="lg">
            <Title order={4} mb="md">
              Processing Log
            </Title>

            <Code block>{state.output}</Code>
          </Card>

          <Card mb="lg">
            <Title order={4}>Visualizer</Title>
            <Text size="sm" c="dimmed" mb="md">
              Play with your data
            </Text>

            <Box>
              <SegmentedControl
                mb="xs"
                value={currentChart}
                onChange={setCurrentChart}
                data={[
                  { label: "Likes", value: "likes" },
                  { label: "Replies", value: "replies" },
                  { label: "Hours Watched", value: "hoursWatched" },
                  { label: "Chapters Read", value: "chaptersRead" },
                  { label: "Episodes Watched", value: "episodesWatched" },
                ]}
              />

              <br />

              <SegmentedControl
                mb="md"
                value={currentView}
                onChange={setCurrentView}
                data={[
                  { label: "Per Month", value: "perMonth" },
                  { label: "Total", value: "total" },
                ]}
              />
            </Box>

            <Line options={options} data={data} />
          </Card>

          <Card mb="lg">
            <Title order={4}>Export History</Title>
            <Text size="sm" color="dimmed">
              Download exported Anilist history as a JSON file
            </Text>

            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                download={`${username}-anilist-history.json`}
              >
                <Button mt="md">Download</Button>
              </a>
            )}
          </Card>
          <Card mb="lg" style={{ flexDirection: "row", columnGap: 3, alignItems: "center" }}>
            <Text>Made with</Text>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "inline" }}
            >
              <path
                fill="currentColor"
                d="M19.5 12.572l-7.5 7.428l-7.5 -7.428m0 0a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"
              ></path>
            </svg>

            <Text>
              by{" "}
              <a
                target="_blank"
                href="https://github.com/blekmus"
                rel="noreferrer"
              >
                blekmus
              </a>
            </Text>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default AnilistExporter;
