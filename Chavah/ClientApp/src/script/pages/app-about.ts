import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BootstrapBase } from '../common/bootstrap-base';

@customElement('app-about')
export class AppAbout extends BootstrapBase {
  static get styles() {
    const localStyles = css`
      :host {
        font-family: var(--subtitle-font);
      }
    `;
    return [
      BootstrapBase.styles,
      localStyles
    ];
  }

  constructor() {
    super();
  }

  render() {
    return html`
      <div class="m-auto row mt-4 g-0 g-sm-1">
        <div class="col-12 col-sm-10 offset-sm-1">
      
          <div class="card mb-3 border-0">
            <div class="row justify-content-center">
              <div class="col-md-4">
                <img src="/assets/images/judah.jpg" class="img-fluid rounded-start"
                  alt="Photo of the author, Judah Gabriel Himango">
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <h5 class="card-title">About us & legal</h5>
                  <div class="card-text">
                    <p>
                      Hi, folks!
                    </p>
                    <p>
                      <a href="https://blog.judahgabriel.com">Judah Gabriel Himango</a> here, author of MessianicChords.
                    </p>
      
                    <p>
                      I hope you all find this site useful! MessianicChords is a non-profit website designed to benefit
                      Messiah's disciples and amplify Messianic Jewish music. I don't accept advertising, nor do I make any
                      money off this site. It is entirely a labor of love for the benefit of the Messianic community.
                    </p>
      
                    <p>
                      There's a great deal of mutual benefit in artists making their lyrics and chords available on the open
                      web. Even so, I recognize that some authors and copyright holders may wish to have their lyrics or
                      chords private or only available commercially. I respect such wishes. If you are the copyright owner of
                      any of the chord sheets found on this site, and you wish to have your chord sheets removed from this
                      site, please contact me at <a href="mailto:contact@messianicchords.com">contact@messianicchords.com</a>,
                      and I'll remove chords for your songs from this site without hesitation.
                    </p>
      
                    <p>
                      To those many artists who have contributed their chord sheets to this site, or otherwise approved having
                      their chords on the opened web - THANK YOU!
                    </p>
      
                    <p>
                      Finally, some of the artists on this website are Jewish, not Christian or Messianic. I have accepted
                      such chord sheets because they are part of our Jewish heritage and because they sing the words of the
                      Scriptures, especially the psalms. In such things, there is only edification.
                    </p>
      
                    <p>
                      Shalom in Yeshua,
                      <br />-Judah
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
