import { Controller } from 'stimulus'
import { Howl } from 'howler'
import PlayAnimation from '../animation/play_animation'

let player
let currentlyOpen
const animation = new PlayAnimation()


function soundID(url) {
  url = url.replace(/^\/+/, '').replace(/\/+$/, '')
  const user = url.split('/').shift()
  const permalink = url.split('/').pop().split('.')[0]
  return `${user}/${permalink}`
}

export default class extends Controller {
  // data-asset-playing="0" data-asset-opened="0">
  static targets = ['play', 'playButton', 'title', 'details',
    'seekBarContainer', 'seekBarLoaded', 'seekBarPlayed']

  initialize() {
    const controller = this
    this.isPlaying = false
    this.url = this.playTarget.firstElementChild.getAttribute('href')
    this.sound = new Howl({
      src: Array(this.url),
      html5: true,
      preload: false,
      onend: controller.playNextTrack.bind(controller),
      onplay() {
        requestAnimationFrame(controller.whilePlaying.bind(controller))
      },
      onload() {
        console.log(this.seek())
      },
    })
  }

  disconnect() {
    if (this.sound.playing()) {
      this.sound.pause()
    }
  }

  whilePlaying() {
    // console.log(`${this.sound.seek()}`)
    this.updateSeekBarPlayed()
    if (this.sound.playing()) {
      setTimeout(requestAnimationFrame(this.whilePlaying.bind(this)), 100);
    }
  }

  play() {
    if (player) {
      player.pause()
    }
    player = this
    this.isPlaying = true
    this.openDetails()
    this.animateLoading()
    this.updateSeekBarLoaded()
    this.element.classList.add('playing')
    this.sound.play()
  }

  pause() {
    this.sound.pause()
    player = null
    this.isPlaying = false
    animation.setPlay()
  }

  togglePlay(e) {
    e.preventDefault()
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  seek(e) {
    e.preventDefault()
    const newPosition = e.offsetX / this.seekBarContainerTarget.offsetWidth
    this.sound.seek(this.sound.duration() * newPosition)
  }

  // With SoundManager we used to animate this width to display
  // how much of the track is downloaded
  // but it's no longer possible with Howl
  updateSeekBarLoaded() {
    this.seekBarContainerTarget.style.display = 'block'
    this.seekBarLoadedTarget.style.width = '100%'
  }
  updateSeekBarPlayed() {
    const position = this.sound.seek() / this.sound.duration()
    const maxwidth = this.seekBarLoadedTarget.offsetWidth
    this.seekBarPlayedTarget.style.width = `${position * maxwidth}px`
  }

  animateLoading() {
    this.playButtonTarget.style.display = 'none'
    this.playTarget.firstElementChild.append(document.getElementById('playAnimationSVG'))
    animation.init()
    animation.setPlay()
    animation.showLoading()
  }

  toggleDetails(e) {
    e.preventDefault()
    const wasOpen = this.element.classList.contains('open')
    // if another track details is open, close it
    if (currentlyOpen) {
      currentlyOpen.element.classList.remove('open')
    }
    if (!wasOpen) {
      this.openDetails()
    }
  }

  openDetails() {
    if (currentlyOpen) {
      currentlyOpen.element.classList.remove('open')
    }
    currentlyOpen = this
    this.element.classList.add('open')
  }

  playNextTrack() {
    const next = this.element.nextSibling
    this.getControllerForElementAndIdentifier(next, 'asset').play()
  }
}
