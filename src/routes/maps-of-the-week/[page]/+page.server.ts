import { getSortedMapsOfTheWeekNetlifyData } from '$lib/getMapsOfTheWeekNetlifyData'
import type { MapOfTheWeek } from '../../../types'

const pageSize = 15

if (pageSize > 50) {
  throw new Error(
    'Page sizes above 50 are not supported. You need to adjust the beatsaver call to accomodate that.',
  )
}

export type MapsOfTheWeekPagePaginatedSSRData = {
  mapsOfTheWeek: MapOfTheWeek[]
  pageSize: number
  pageCount: number
  currentPage: number
}

type LoadFunctionParameter = {
  params: {
    page: string
  }
  fetch: typeof fetch
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function load({
  fetch,
  params,
}: LoadFunctionParameter): Promise<MapsOfTheWeekPagePaginatedSSRData> {
  // Starts at 1
  const pageNumber = parseInt(params.page, 10)
  if (isNaN(pageNumber) || pageNumber < 1 || !isFinite(pageNumber)) {
    throw new Error('Invalid page number')
  }

  const startIndex = (pageNumber - 1) * pageSize
  const endIndex = pageNumber * pageSize

  const allMapsOfTheWeekNetlifyData = await getSortedMapsOfTheWeekNetlifyData()

  const pageCount = Math.ceil(allMapsOfTheWeekNetlifyData.length / pageSize)

  const paginatedMapsOfTheWeek = allMapsOfTheWeekNetlifyData.slice(startIndex, endIndex)

  const mapIds = paginatedMapsOfTheWeek.map((map) => map.mapId).join(',')
  // Data structure is an object with a key of the mapId and the value is the map data
  const allBeatSaverMapData = await fetch(`https://api.beatsaver.com/maps/ids/${mapIds}`).then(
    (x) => x.json(),
  )

  const uploaderIds = Array.from(
    new Set(Object.values(allBeatSaverMapData).map((map: any) => map.uploader.id)),
  ).join(',')
  // this api endpoint work differently, so we need to convert it to a map ourselves
  const intermediaryAllBeatSaverMapperdata = await fetch(
    `https://api.beatsaver.com/users/ids/${uploaderIds}`,
  ).then((x) => x.json())
  const allBeatSaverMapperData = {} as Record<string, any>
  for (const mapper of intermediaryAllBeatSaverMapperdata) {
    allBeatSaverMapperData[mapper.id] = mapper
  }

  const paginatedFullMapsOfTheWeek = []
  // Not Promise.all'ing since that will just get you rate limited from beatsaver
  for (const singleMapOfTheWeek of paginatedMapsOfTheWeek) {
    let coverUrl = singleMapOfTheWeek.coverUrlOverwrite

    // Fetch BeatLeader URL if not given
    // If this is happens to frequently it will get rate limited
    if (coverUrl == null) {
      const beatLeaderLeaderBoardData = await fetch(
        `https://api.beatleader.xyz/leaderboard/${singleMapOfTheWeek.mapId}`,
      ).then((res) => res.json())

      coverUrl = beatLeaderLeaderBoardData.song.fullCoverImage
    }

    const beatSaverMapData = allBeatSaverMapData[singleMapOfTheWeek.mapId]
    const beatSaverMapUploaderData = allBeatSaverMapperData[beatSaverMapData.uploader.id]

    paginatedFullMapsOfTheWeek.push({
      map: {
        id: singleMapOfTheWeek.mapId,
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
      review: singleMapOfTheWeek.review,
      startDate: singleMapOfTheWeek.startDate,
    })
  }

  return { mapsOfTheWeek: paginatedFullMapsOfTheWeek, pageSize, pageCount, currentPage: pageNumber }
}
