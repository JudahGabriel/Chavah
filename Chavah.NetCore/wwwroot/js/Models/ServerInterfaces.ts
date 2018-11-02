﻿module BitShuva.Chavah.Server {


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
        reasonsPlayed: Server.SongPickReasons | null;
        albumColors: AlbumColors;
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

    export interface SongUpload {
        address: string;
        fileName: string;
    }

    export interface SongEdit {
        id: string;
        status: SongEditStatus;
        submitDate: string;
        userId: string;
        songId: string;
        newArtist: string;
        newAlbum: string;
        newName: string;
        newHebrewName: string;
        newTags: string[];
        newLyrics: string;
        oldArtist: string;
        oldAlbum: string;
        oldLyrics: string;
        oldName: string;
        oldHebrewName: string;
        oldTags: string[];
    }

    export interface AlbumUpload {
        name: string,
        artist: string,
        albumArtUri: string,
        songs: Server.SongUpload[],
        purchaseUrl: string,
        genres: string,
        foreColor: string,
        backColor: string,
        mutedColor: string,
        textShadowColor: string
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

    export interface StructuredLog {
        id: string;
        messageTemplate: string;
        occurrenceCount: number;
        level: LogLevel;
        firstOccurrence: string;
        lastOccurrence: string;
        occurrences: Log[];
    }

    export interface Log {
        message: string;
        level: LogLevel;
        created: string;
        exception: string | null;
        category: string;
        eventId: number | null;
        templateValues: {} | null;
        scope: string | null;
    }

    // account
    export interface IConfigViewModel {
        debug: boolean;
        songId: string | null;
        redirect: string | null;
        embed: boolean;
        cacheBustedAngularViews: string[];
        defaultUrl: string;
        cdnUrl: string;
        soundEffects: string;
        title: string;
        description: string;
        song: any;
    };

    export interface IUserViewModel {
        totalPlays: number;
        registrationDate: string;
        lastSeen: string;
        totalSongRequests: number;
        requiresPasswordReset: boolean;
        recentSongIds: string[];
        notifications: Server.Notification[];
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
}