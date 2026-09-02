import { httpApi } from "./http-api-service";
import { Artist } from "../models/artist";
import type {
  Artist as ServerArtist,
  ArtistWithNetLikeCount,
  DueDonation,
  PagedList,
  PaypalOrderConfirmation,
} from "../models/server-interfaces";

/**
 * Artist-related API calls. Ported from the AngularJS `ArtistApiService`; `$http`
 * becomes the fetch-based `httpApi`. Donation/PayPal methods are added by the
 * donate/admin page migrations.
 */
export class ArtistApiService {
  getAll(search = "", skip = 0, take = 1024): Promise<PagedList<ServerArtist>> {
    const args = { search, skip, take };
    return httpApi.query("/api/artists/getAll", args);
  }

  getByName(artistName: string): Promise<Artist> {
    return httpApi.query("/api/artists/getByName", { artistName }, ArtistApiService.artistSelector);
  }

  save(artist: ServerArtist): Promise<Artist> {
    return httpApi.post("/api/artists/save", artist, ArtistApiService.artistSelector);
  }

  getLikedArtists(skip: number, take: number, search: string): Promise<PagedList<ArtistWithNetLikeCount>> {
    const args = { skip, take, search };
    return httpApi.query("/api/artists/getLikedArtists", args);
  }

  getDueDonations(minimum: number): Promise<DueDonation[]> {
    return httpApi.query("/api/artists/getDueDonations", { minimum });
  }

  markDueDonationAsPaid(donation: DueDonation): Promise<DueDonation> {
    return httpApi.post("/api/artists/markDueDonationAsPaid", donation);
  }

  recordMessiahsMusicFundMonthlyDisbursement(
    year: number,
    month: number,
    donationDollars: number,
  ): Promise<void> {
    const args = { year, month, donations: donationDollars };
    return httpApi.postUriEncoded("/api/artists/RecordMessiahsMusicFundMonthlyDisbursement", args);
  }

  createPaypalOrder(donation: DueDonation): Promise<PaypalOrderConfirmation> {
    return httpApi.post("/api/artists/createPaypalOrder", donation);
  }

  payPaypalOrder(donation: DueDonation): Promise<PaypalOrderConfirmation> {
    return httpApi.post("/api/artists/payOrder", donation);
  }

  static artistSelector(serverObj: ServerArtist): Artist {
    return new Artist(serverObj);
  }
}

export const artistApi = new ArtistApiService();
