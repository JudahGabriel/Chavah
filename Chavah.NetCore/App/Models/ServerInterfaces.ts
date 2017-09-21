﻿module BitShuva.Chavah.Server {
    export interface IApplicationUser {
        totalPlays: number;
        preferences: any;
        registrationDate: string;
        lastSeen: string;
        totalSongRequests: number;
        requiresPasswordReset: boolean;
        accessFailedCount: number;
        claims: any[];
        email: string;
        id: string;
        isEmailConfirmed: boolean;
        isPhoneNumberConfirmed: boolean;
        lockoutEnabled: boolean;
        lockoutEndDate: string;
        logins: any[];
        passwordHash: string;
        phoneNumber: string;
        roles: string[];
        securityStamp: string;
        twoFactorAuthEnabled: boolean;
    }

    export interface ISong {
        name: string;
        number: number;
        album: string;
        artist: string;
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
        reasonsPlayed: Server.ISongPickReasons | null;
    }

    export interface IUpDownVotes {
        upVotes: number;
        downVotes: number;
        songId: string;
    }

    export interface IArtist {
        name: string;
        images: string[];
        bio: string;
    }

    export interface IPagedList<T> {
        items: T[];
        total: number;
        skip: number;
        take: number;
    }

    export interface ISongUpload {
        address: string;
        fileName: string;
    }

    export interface ISongEdit {
        id: string;
        status: SongEditStatus;
        submitDate: string;
        userId: string;
        songId: string;
        newArtist: string;
        newAlbum: string;
        newName: string;
        newTags: string[];
        newLyrics: string;
        oldArtist: string;
        oldAlbum: string;
        oldLyrics: string;
        oldName: string;
        oldTags: string[];
    }

    export interface IAlbumUpload {
        name: string,
        artist: string,
        albumArtUri: string,
        songs: Server.ISongUpload[],
        purchaseUrl: string,
        genres: string,
        foreColor: string,
        backColor: string,
        mutedColor: string,
        textShadowColor: string
    }

    export interface IAlbum {
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

    export interface IRegisterResults {
        success: boolean;
        errorMessage: string | null;
        isAlreadyRegistered: boolean;
        needsConfirmation: boolean;
    }

    export interface IConfirmEmailResult {
        success: boolean;
        errorMessage: string;
    }

    export interface IResetPasswordResult {
        success: boolean;
        errorMessage: string;
        invalidEmail: boolean;
    }

    export interface ISongPickReasons {
        songId: string;
        artist: LikeLevel;
        album: LikeLevel;
        songThumbedUp: boolean;
        ranking: LikeLevel;
        similar: LikeLevel;
        soleReason: SongPick | null;
    }

    export interface INotification {
        title: string;
        url: string;
        isUnread: boolean;
        sourceName: string;
        imageUrl: string | null;
        date: string;
    }

    export interface ILogSummary {
        id: string;
        message: string;
        exception: string;
        level: LogLevel;
        firstOccurrence: string;
        lastOccurrence: string;
        occurrences: any[];
        occurrencesCount: number;
    }
}