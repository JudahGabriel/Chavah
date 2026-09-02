// Server DTO shapes (camelCased JSON from the ASP.NET backend). Ported from the
// AngularJS-era `BitShuva.Chavah.Server` module. Phase-1 subset: the interfaces the
// migrated client currently needs. Interfaces that depended on out-of-scope enums
// (LogLevel, SongEditStatus) or unported feature areas (uploads, donations) are omitted.

import type { CommunityRankStanding } from "./community-rank-standing";
import type { SongLike } from "./song-like";
import type { LikeLevel } from "./like-level";
import type { SongPick } from "./song-pick";
import type { SignInStatus } from "./sign-in-status";

export interface Song {
  name: string;
  number: number;
  album: string;
  albumId: string | null;
  artist: string;
  artistId: string | null;
  communityRank: number;
  communityRankStanding: CommunityRankStanding;
  id: string;
  albumArtUri: string;
  totalPlays: number;
  uri: string;
  songLike: SongLike;
  lyrics: string;
  genres: string[];
  tags: string[];
  artistImages: string[];
  purchaseUri: string;
  reasonsPlayed: SongPickReasons | null;
  albumColors: AlbumColors;
  commentCount: number;
}

export interface AlbumColors {
  background: string;
  foreground: string;
  muted: string;
  textShadow: string;
}

export interface UpDownVotes {
  upVotes: number;
  downVotes: number;
  songId: string;
}

export interface Artist {
  name: string;
  images: string[];
  bio: string;
}

export interface ArtistWithNetLikeCount extends Artist {
  netLikeCount: number;
  likeCount: number;
  dislikeCount: number;
  userId: string;
}

export interface PagedList<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
}

export interface Album {
  artist: string;
  name: string;
  albumArtUri: string | null;
  id: string;
  backgroundColor: string;
  foregroundColor: string;
  mutedColor: string;
  textShadowColor: string;
  isVariousArtists: boolean;
  songCount: number;
}

export interface AlbumWithNetLikeCount extends Album {
  netLikeCount: number;
  likeCount: number;
  dislikeCount: number;
  userId: string;
}

export interface ConfirmEmailResult {
  success: boolean;
  errorMessage: string;
}

export interface ResetPasswordResult {
  success: boolean;
  errorMessage: string;
  invalidEmail: boolean;
}

export interface SongPickReasons {
  songId: string;
  artist: LikeLevel;
  album: LikeLevel;
  songThumbedUp: boolean;
  ranking: LikeLevel;
  similar: LikeLevel;
  soleReason: SongPick | null;
}

export interface Notification {
  title: string;
  url: string;
  isUnread: boolean;
  sourceName: string;
  imageUrl: string | null;
  date: string;
}

// account
export interface HomeViewModel {
  debug: boolean;
  redirect: string | null;
  embed: boolean;
  autoplay: boolean;
  defaultUrl: string;
  cdnUrl: string;
  soundEffects: string;
  pageTitle: string;
  pageDescription: string;
  descriptiveImageUrl: string;
  song: Song | null;
  user: User | null;
  isDownForMaintenance: boolean;
  pushNotificationsPublicKey: string;
  filePickrKey: string;
}

export interface User {
  totalPlays: number;
  registrationDate: string;
  lastSeen: string;
  totalSongRequests: number;
  requiresPasswordReset: boolean;
  recentSongIds: string[];
  notifications: Notification[];
  accessFailedCount: number;
  claims: any[];
  email: string;
  id: string;
  userName: string;
  emailConfirmed: boolean;
  isPhoneNumberConfirmed: boolean;
  lockoutEnabled: boolean;
  lockoutEndDate: string | null;
  twoFactorEnabled: boolean;
  phoneNumber: string;
  roles: string[];
  profilePicUrl: string | null;
  firstName: string;
  lastName: string;
}

export interface IRegisterResults {
  success: boolean;
  errorMessage: string | null;
  isAlreadyRegistered: boolean;
  needsConfirmation: boolean;
  isPwned: boolean;
}

export interface IRegisterModel {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ISignInModel {
  email: string;
  password: string;
  staySignedIn: boolean;
}

export interface ISignInResult {
  status: SignInStatus;
  errorMessage: string | null;
  user: User | null;
}

export interface IPushSubscription {
  appUserId: string;
  createDate: string;
  endpoint: string;
  keys: { auth: string; p256dh: string };
}

export interface CommentThread {
  id: string;
  songId: string;
  comments: Comment[];
}

export interface Comment {
  userId: string;
  userDisplayName: string;
  content: string;
  date: string;
  flagCount: number;
  lastFlagDate: string | null;
}
