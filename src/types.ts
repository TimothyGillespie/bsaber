export type Post = {
  title: string
  section: 'announcements' | 'articles' | 'speciality'
  publish: string
  body: string
  slug: string
  homepageText?: string
  image?: string
  icon?: string
  category: '' | 'announcement' | 'news' | 'articles' | 'interview' | 'event'
  authors: string[]
  credits: { contributors: string[], contributon?: string }[]
}

export interface Author extends Uploader {
  bio: Person['bio']
  socialLinks: Person['socialLinks']
}

export type PostWithAuthorAndContributor = Omit<Post, 'authors' | 'credits'> & {
  authors: Author[]
  credits: { contributors: Uploader[], contributon?: string }[]
}

export type CommunityEvent = {
  title: string
  slug: string
  publishDateISO: string
  dateParams: EventDateParams
  hostUsername: string
  category: 'tournament' | 'social' | 'learning' | 'competition' | 'generic' // category determines icon
}

export type EventDateParams = {
  startDateUTC: string
  endDateUTC?: string
  startTimeUTC?: string
  endTimeUTC?: string
}

export type MapOfTheWeekCollectionData = {
  mapId: string
  review: string
  startDate: string
  coverUrlOverwrite?: string
}

export type MapOfTheWeek = {
  map: {
    id: string
    name: string
    coverUrl: string
    uploader: Uploader
  }
  review: string
  startDate: Date
}

export type Playlist = {
  playlistId: number
  name: string
  description: string
  playlistImage512: string
  owner: Uploader
}

export type Beatmap = {
  id: number
  name: string
  description: string
  uploader: Uploader
  curator: Uploader | undefined
  versions: BeatmapVersion[]
  tags: string[] | undefined
}

export type BeatmapVersion = {
  hash: string
  diffs: BeatmapDifficulty[]
}

export type BeatmapDifficulty = {
  characteristic:
  | 'Standard'
  | 'OneSaber'
  | 'NoArrows'
  | '90Degree'
  | '360Degree'
  | 'Lightshow'
  | 'Lawless'
  | 'Legacy'
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Expert' | 'ExpertPlus'
}

export type Person = {
  name: string;
  beatsaverId: string;
  bio?: string;
  socialLinks: {
    platform: 'discord' | 'twitter' | 'beatsaver';
    id: string;
  }[];
}


export type Uploader = {
  id: number
  name: string
  avatar: string
  admin: boolean
  curator: boolean
  verifiedMapper: boolean
}

export type CardData = {
  slug: string
  image: string
  publish: string
  title?: string
  category?: string
}

type ImportModuleData<T> = {
  metadata: T
}

export type ImportPostModuleData = ImportModuleData<Omit<Post, 'slug'>>

export type ImportMapOfTheWeekModuleData = ImportModuleData<MapOfTheWeekCollectionData>
export type ImportPersonModuleData = ImportModuleData<Person>;

export type RootPageSSRData = {
  announcements: Post[]
  articles: Post[]
  others: Post[]
  communityEvents: CommunityEvent[]
  currentMapOfTheWeek: MapOfTheWeek | undefined
}
