import { LocalActivity } from "../types/AnilistTypes";

export default function ActivityHistory(activityHistory: LocalActivity[]) {
  const likesPerMonth = [] as { id: string; count: number }[];
  const repliesPerMonth = [] as { id: string; count: number }[];
  const hoursWatched = [] as { id: string; count: number }[];
  const chaptersRead = [] as { id: string; count: number }[];
  const episodesWatched = [] as { id: string; count: number }[];

  activityHistory.forEach((activity) => {
    const date = new Date(activity.createdAt * 1000);
    const year = date.getFullYear();

    // check if month+year exists in likesPerMonth
    const index = likesPerMonth.findIndex(
      (item) =>
        item.id === `${date.toLocaleString("en", { month: "short" })} ${year}`
    );

    if (index === -1) {
      likesPerMonth.push({
        id: `${date.toLocaleString("en", { month: "short" })} ${year}`,
        count: activity.likes,
      });
    } else {
      likesPerMonth[index].count += activity.likes;
    }

    // check if month+year exists in repliesPerMonth
    const index2 = repliesPerMonth.findIndex(
      (item) =>
        item.id === `${date.toLocaleString("en", { month: "short" })} ${year}`
    );

    if (index2 === -1) {
      repliesPerMonth.push({
        id: `${date.toLocaleString("en", { month: "short" })} ${year}`,
        count: activity.replies,
      });
    } else {
      repliesPerMonth[index2].count += activity.replies;
    }

    // set hoursWatched & episodesWatched
    if (
      activity.duration &&
      activity.progress &&
      activity.type === "ANIME_LIST"
    ) {
      // set hoursWatched
      const index3 = hoursWatched.findIndex(
        (item) =>
          item.id === `${date.toLocaleString("en", { month: "short" })} ${year}`
      );

      if (index3 === -1) {
        let episodeNumber: number;

        if (activity.progress.includes("-")) {
          const startEp = activity.progress.split("-")[0].trim();
          const endEp = activity.progress.split("-")[1].trim();
          episodeNumber = Number(endEp) - Number(startEp) + 1;
        } else {
          episodeNumber = 1;
        }

        hoursWatched.push({
          id: `${date.toLocaleString("en", { month: "short" })} ${year}`,
          count: (episodeNumber * activity.duration) / 60,
        });
      } else {
        let episodeNumber: number;

        if (activity.progress.includes("-")) {
          const startEp = activity.progress.split("-")[0].trim();
          const endEp = activity.progress.split("-")[1].trim();
          episodeNumber = Number(endEp) - Number(startEp) + 1;
        } else {
          episodeNumber = 1;
        }

        hoursWatched[index3].count += (episodeNumber * activity.duration) / 60;
      }

      // set episodesWatched
      const index4 = episodesWatched.findIndex(
        (item) =>
          item.id === `${date.toLocaleString("en", { month: "short" })} ${year}`
      );

      if (index4 === -1) {
        let episodeNumber: number;

        if (activity.progress.includes("-")) {
          const startEp = activity.progress.split("-")[0].trim();
          const endEp = activity.progress.split("-")[1].trim();
          episodeNumber = Number(endEp) - Number(startEp) + 1;
        } else {
          episodeNumber = 1;
        }

        console.log({
          id: `${date.toLocaleString("en", { month: "short" })} ${year}`,
          count: episodeNumber,
        });

        episodesWatched.push({
          id: `${date.toLocaleString("en", { month: "short" })} ${year}`,
          count: episodeNumber,
        });
      } else {
        let episodeNumber: number;

        if (activity.progress.includes("-")) {
          const startEp = activity.progress.split("-")[0].trim();
          const endEp = activity.progress.split("-")[1].trim();
          episodeNumber = Number(endEp) - Number(startEp) + 1;
        } else {
          episodeNumber = 1;
        }

        episodesWatched[index4].count += episodeNumber;
      }
    }

    // set chaptersRead
    if (activity.progress && activity.type === "MANGA_LIST") {
      const index4 = chaptersRead.findIndex(
        (item) =>
          item.id === `${date.toLocaleString("en", { month: "short" })} ${year}`
      );

      if (index4 === -1) {
        let chapterNumber: number;

        if (activity.progress.includes("-")) {
          const startEp = activity.progress.split("-")[0].trim();
          const endEp = activity.progress.split("-")[1].trim();
          chapterNumber = Number(endEp) - Number(startEp) + 1;
        } else {
          chapterNumber = 1;
        }

        chaptersRead.push({
          id: `${date.toLocaleString("en", { month: "short" })} ${year}`,
          count: chapterNumber,
        });
      } else {
        let chapterNumber: number;

        if (activity.progress.includes("-")) {
          const startEp = activity.progress.split("-")[0].trim();
          const endEp = activity.progress.split("-")[1].trim();
          chapterNumber = Number(endEp) - Number(startEp) + 1;
        } else {
          chapterNumber = 1;
        }

        chaptersRead[index4].count += chapterNumber;
      }
    }
  });

  return {
    likesPerMonth,
    repliesPerMonth,
    hoursWatched,
    chaptersRead,
    episodesWatched,
  };
}
