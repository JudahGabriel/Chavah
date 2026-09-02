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

export interface TempFile {
  id: string;
  cdnId: string | null;
  url: string;
  name: string;
  createdAt: string;
}

export interface AlbumSubmissionByArtist {
  artistEmail: string;
  artistPayPalEmail: string;
  name: string;
  hebrewName: string | null;
  artist: string;
  albumArt: TempFile;
  backColor: string;
  foreColor: string;
  mutedColor: string;
  textShadowColor: string;
  genres: string;
  purchaseUrl: string;
  songs: TempFile[];
}

export interface SongEdit {
  id?: string;
  status?: string;
  submitDate?: string;
  userId?: string;
  songId: string;
  newName: string;
  newUri: string;
  newHebrewName: string | null;
  newAlbum: string;
  newArtist: string;
  newLyrics: string;
  newTags: string[];
  newContributingArtists: string[];
  oldName?: string;
  oldHebrewName?: string | null;
  oldAlbum?: string;
  oldArtist?: string;
  oldLyrics?: string;
  oldTags?: string[];
  oldContributingArtists?: string[];
}

// --- Admin: donations (ported from ArtistApiService/AdminDonations) ---

export interface Donation {
  amount: number;
  donorName: string;
  donorEmail: string;
  date: string;
  distributionDate: string | null;
}

export interface DonationContext extends Donation {
  recipientArtist: string | null;
  artistId: string;
}

export interface PaypalOrderConfirmation {
  orderId: string;
  approveUrl: string;
}

export interface DueDonation {
  artistId: string;
  hasDeclinedDonations: boolean;
  name: string;
  amount: number;
  donationUrl: string;
  donations: DonationContext[];
  order: PaypalOrderConfirmation | null;
}

// --- Admin: album upload (ported from AlbumApiService/UploadAlbum) ---

export interface AlbumUpload {
  name: string;
  hebrewName: string | null;
  artist: string;
  albumArt: TempFile;
  songs: TempFile[];
  purchaseUrl: string;
  genres: string;
  foreColor: string;
  backColor: string;
  mutedColor: string;
  textShadowColor: string;
}

// --- Admin: logs (ported from LogService/LogEditor) ---

export enum LogLevel {
  Trace = 0,
  Debug = 1,
  Information = 2,
  Warning = 3,
  Error = 4,
  Critical = 5,
  None = 6,
}

export enum LogSort {
  Oldest = 0,
  Newest = 1,
  OccurrenceCount = 2,
}

export interface Log {
  message: string;
  level: LogLevel;
  created: string;
  exception: string | null;
  category: string;
  eventId: number | null;
  templateValues: Record<string, unknown> | null;
  scope: string | null;
}

export interface StructuredLog {
  id: string;
  messageTemplate: string;
  occurrenceCount: number;
  level: LogLevel;
  firstOccurrence: string;
  lastOccurrence: string;
  occurrences: Log[];
}
