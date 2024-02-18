import { getSortedMapsOfTheWeekNetlifyData } from '$lib/getMapsOfTheWeekNetlifyData'
import type {
  Post,
  MapOfTheWeek,
  CommunityEvent,
  ImportPostModuleData,
  ImportMapOfTheWeekModuleData,
} from '../types'
export type RootPageSSRData = {
  announcements: Post[]
  articles: Post[]
  others: Post[]
  communityEvents: CommunityEvent[]
  currentMapOfTheWeek: MapOfTheWeek | undefined
}
export async function load({ fetch }): Promise<RootPageSSRData> {
  const posts: Post[] = await Promise.all(
    Object.entries(import.meta.glob<ImportPostModuleData>('/src/collections/posts/**/*.md')).map(
      async ([path, module]) => {
        const { metadata } = await module()
        const slug = path.split('/').reverse()[0].split('.')[0]
        const { image } = metadata
        return { slug, ...metadata, image: image?.replace('/static', '') }
      },
    ),
  )

  let currentMapOfTheWeek: MapOfTheWeek | undefined = undefined
  try {
    const mapsOfTheWeek = await getSortedMapsOfTheWeekNetlifyData()

    // Since it's sorted it's the first one
    const currentMOTWCollectionData = mapsOfTheWeek[0]

    const beatSaverMapData = await fetch(
      `https://api.beatsaver.com/maps/id/${currentMOTWCollectionData.mapId}`,
    ).then((res) => res.json())
    const beatSaverMapUploaderData = await fetch(
      `https://api.beatsaver.com/users/id/${beatSaverMapData.uploader.id}`,
    ).then((res) => res.json())

    let coverUrl = currentMOTWCollectionData.coverUrlOverwrite
    if (coverUrl == null) {
      const beatLeaderLeaderBoardData = await fetch(
        `https://api.beatleader.xyz/leaderboard/${beatSaverMapData.id}`,
      ).then((res) => res.json())
      coverUrl = beatLeaderLeaderBoardData.song.fullCoverImage
    }

    if (coverUrl == null) {
      throw new Error('No cover URL found!')
    }

    currentMapOfTheWeek = {
      map: {
        id: beatSaverMapData.id,
        name: beatSaverMapData.name,
        coverUrl: coverUrl,
        uploader: {
          id: beatSaverMapData.uploader.id,
          name: beatSaverMapData.uploader.name,
          avatar: beatSaverMapData.uploader.avatar,
          admin: beatSaverMapUploaderData.admin,
          curator: beatSaverMapUploaderData.curator,
          verifiedMapper: beatSaverMapUploaderData.verifiedMapper,
        },
      },
      review: currentMOTWCollectionData.review,
      startDate: currentMOTWCollectionData.startDate,
    }
  } catch (e) {
    console.error(`Could not find a suitable map of the week.`)
  }

  const rootPageSSRData: Omit<RootPageSSRData, 'currentMapOfTheWeek' | 'communityEvents'> = {
    announcements: [],
    articles: [],
    others: [],
  }

  for (const post of posts) {
    const { section } = post
    switch (section) {
      case 'announcements':
        rootPageSSRData.announcements.push(post)
        break
      case 'articles':
        rootPageSSRData.articles.push(post)
        break
      default:
        rootPageSSRData.others.push(post)
        break
    }
  }

  // Sort all by publish data
  const sortByPublishDate = (a: Post, b: Post) => b.publish.localeCompare(a.publish)
  for (const [key, value] of Object.entries(rootPageSSRData)) {
    rootPageSSRData[key as keyof typeof rootPageSSRData] = value.sort(sortByPublishDate)
  }

  return {
    ...rootPageSSRData,
    communityEvents: [],
    currentMapOfTheWeek,
  }
}
