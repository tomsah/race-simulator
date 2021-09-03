// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
}

const updateStore = (newState) => {
  const newStore = {
    ...store,
    ...newState,
  }
  store = newStore
  return store
}

const WACKY_RACE_TEAM = [
  'Dastardly & Muttley',
  'Penelope Pitstop',
  'Rock Slag',
  'the gruesome twosome',
  'professor pat',
]

const IMAGE_MAP = {
  'Dastardly & Muttley': 'dastardly.jpeg',
  'Penelope Pitstop': 'penelope.jpeg',
  'Rock Slag': 'rock-slag.jpeg',
  'the gruesome twosome': 'gruesome.jpeg',
  'professor pat': 'professor.jpeg',
}

const RACE_MAP = {
  'race-1': 'Speeding for Smogland',
  'race-2': 'Creepy trip to lemon twist',
  'race-3': 'Overseas Hi-way race',
  'race-4': 'The Speedy Arkansas traveller',
  'race-5': 'The Carlsbad or bust bash',
  'race-6': 'Hot race at chillicothe',
}

const customRacersName = (arr, customNameArr) =>
  arr.map((item, index) => {
    item.driver_name = customNameArr[index]
    return item
  })

// We need our javascript to wait until the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  onPageLoad()
  setupClickHandlers()
})

async function onPageLoad() {
  try {
    getTracks().then((tracks) => {
      const html = renderTrackCards(tracks)
      renderAt('#tracks', html)
    })

    getRacers().then((racers) => {
      const html = renderRacerCars(racers)
      renderAt('#racers', html)
    })
  } catch (error) {
    console.log('Problem getting tracks and racers ::', error.message)
    console.error(error)
  }
}

function setupClickHandlers() {
  document.addEventListener(
    'click',
    function (event) {
      let parent = event.target.parentElement
      const {target} = event

      if (parent.matches('.card.track')) {
        handleSelectTrack(parent)
      }

      if (parent.matches('.card.podracer')) {
        handleSelectPodRacer(parent)
      }

      // Race track form field
      if (target.matches('.card.track')) {
        handleSelectTrack(target)
      }

      // Podracer form field
      if (target.matches('.card.podracer')) {
        event.stopPropagation()
        handleSelectPodRacer(target)
      }

      // Submit create race form
      if (target.matches('#submit-create-race')) {
        event.preventDefault()
        // start race
        handleCreateRace()
      }

      // Handle acceleration click
      if (target.matches('#gas-peddle')) {
        handleAccelerate()
      }
    },
    false,
  )
}

async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms))
  } catch (error) {
    console.log("an error shouldn't be possible here")
    console.log(error)
  }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  const {player_id, track_id} = store
  const race = await createRace(player_id, track_id).catch((err) => {
    console.log(
      `an error happen when creating the race ${err} - Please reload and try again!!`,
    )
    console.error(err)
  })
  updateStore({race_id: race.ID})
  // render starting UI
  renderAt('#race', renderRaceStartView(race.Track))

  // The race has been created, now start the countdown
  await runCountdown().catch((error) => {
    console.log(`Something went wrong, ${error}`)
  })

  /*
   * Know BUG!!!
   * we have to subtract 1 to the race_id to provide the correct race_id
   * https://github.com/udacity/nd032-c3-asynchronous-programming-with-javascript-project-starter/issues/6
   */

  await startRace(store.race_id - 1).catch((error) => {
    console.log(`Something went wrong, ${error}`)
  })

  await runRace(store.race_id - 1)
}

const carAnimation = (arr) => {
  const imgList = document.querySelectorAll('.car-animation')
  imgList.forEach((item) => {
    arr.forEach((elm) => {
      if (elm.driver_name.includes(item.id)) {
        item.style.transform = `translateX(${(elm.segment / 201) * 100}%)`
      }
    })
  })
}

function runRace(raceID) {
  return new Promise((resolve) => {
    const progressCheck = async () => {
      const res = await getRace(raceID)
      renderAt('#leaderBoard', raceProgress(res.positions))
      carAnimation(res.positions)
      if (res.status === 'finished') {
        clearInterval(raceInterval) // to stop the interval from repeating
        renderAt('#race', resultsView(res.positions)) // to render the results view
        resolve(res) // resolve the promise
      }
    }
    const raceInterval = setInterval(progressCheck, 500)
  })
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000)
    let timer = 3
    return new Promise((resolve) => {
      const decrement = () => {
        --timer
        // run this DOM manipulation to decrement the countdown for the user
        document.getElementById('big-numbers').innerHTML = timer
        if (timer === 0) {
          clearInterval(countDown)
          resolve()
          return
        }
        return timer
      }

      const countDown = setInterval(decrement, 1000)
    })
  } catch (error) {
    console.log(error)
  }
}

function handleSelectPodRacer(target) {
  // remove class selected from all racer options
  const selected = document.querySelector('#racers .selected')
  if (selected) {
    selected.classList.remove('selected')
  }

  // add class selected to current target
  target.classList.add('selected')
  if (store.track_id && target.id) {
    document.getElementById('submit-create-race').disabled = false
  }
  updateStore({player_id: target.id})
}

function handleSelectTrack(target) {
  // remove class selected from all track options
  const selected = document.querySelector('#tracks .selected')
  if (selected) {
    selected.classList.remove('selected')
  }

  // add class selected to current target
  target.classList.add('selected')
  if (store.player_id && target.id) {
    document.getElementById('submit-create-race').disabled = false
  }
  updateStore({track_id: target.id})
}

function handleAccelerate() {
  console.log('accelerate button clicked')
  accelerate(store.race_id - 1)
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`
  }

  const results = customRacersName(racers, WACKY_RACE_TEAM)
    .map(renderRacerCard)
    .join('')

  return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
  const {id, driver_name, top_speed, acceleration, handling} = racer

  const imageSrc = `../assets/images/${IMAGE_MAP[driver_name]}`

  return `
		<li class="card podracer" id="${id}">
    <div class='img-holder'>
     <image src=${imageSrc} />
    </div>
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`
  }

  const results = tracks.map(renderTrackCard).join('')

  return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
  const {id} = track
  const imgSrc = `../assets/images/race-${id}.jpeg`
  const raceName = RACE_MAP[`race-${id}`]
  return `
		<li id="${id}" class="card track">
			<h3>${raceName}</h3>
      <div class='img-holder'>
        <img src=${imgSrc} />
      </div>
		</li>
	`
}

function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceTrack(playerList, imageList) {
  return playerList
    .map((p) => {
      const imageSrc = `../assets/images/${imageList[p]}`
      return `
      <li class='track-progress' >
        <div class='car-animation' id='${p}'>
          <img src=${imageSrc}  ${
        playerList[store.player_id - 1] === p ? 'class ="player-car"' : null
      }  />
        </div>
      <div class='track-separation'></div>
      </li>
    `
    })
    .join('')
}

function renderRaceStartView(track) {
  /*
   * Track name is always 'Track 1' which seems to be a known bug
   * https://github.com/udacity/nd032-c3-asynchronous-programming-with-javascript-project-starter/issues/14
   */
  return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section class='leaderBoard-container'>
      <div id="leaderBoard">
				${renderCountdown(3)}
      </div>
      <div>
        <ul class='car-list'>
          ${renderRaceTrack(WACKY_RACE_TEAM, IMAGE_MAP)}
        </ul>
      </div>
			</section>


			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1))

  return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a class="cta-btn" href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
  let userPlayer = customRacersName(positions, WACKY_RACE_TEAM).find(
    (e) => e.id === parseInt(store.player_id),
  )
  userPlayer.driver_name += ' (you)'

  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1))
  let count = 1

  const results = positions
    .map((p) => {
      return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
    })
    .join('')

  return `
		<main>
			<h3>Leader board</h3>
			<section class='progress-leaderBoard' id="leaderBoard">
				${results}
      </section>
		</main>
	`
}

function renderAt(element, html) {
  const node = document.querySelector(element)

  node.innerHTML = html
}

// ^ Provided code ^ do not remove
// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
  return {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': SERVER,
    },
  }
}

function getTracks() {
  // GET request to `${SERVER}/api/tracks`
  return fetch(`${SERVER}/api/tracks`)
    .then((res) => res.json())
    .catch((err) => {
      console.log('Problem getting tracks ::', err.message)
      console.error(err)
    })
}

function getRacers() {
  // GET request to `${SERVER}/api/cars`
  return fetch(`${SERVER}/api/cars`)
    .then((res) => res.json())
    .catch((err) => {
      console.log('Problem getting cars ::', err.message)
      console.error(err)
    })
}

function createRace(player_id, track_id) {
  player_id = parseInt(player_id)
  track_id = parseInt(track_id)
  const body = {player_id, track_id}

  return fetch(`${SERVER}/api/races`, {
    method: 'POST',
    ...defaultFetchOpts(),
    dataType: 'jsonp',
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => console.log('Problem with createRace request::', err))
}

function getRace(id) {
  // GET request to `${SERVER}/api/races/${id}`
  return fetch(`${SERVER}/api/races/${id}`)
    .then((res) => res.json())
    .catch((err) => {
      console.log('Problem getting race ::', err.message)
      console.error(err)
    })
}

async function startRace(id) {
  return fetch(`${SERVER}/api/races/${id}/start`, {
    method: 'POST',
    ...defaultFetchOpts(),
  })
    .then((res) => res)
    .catch((err) => console.log('Problem with startRace request::', err))
}

function accelerate(id) {
  // POST request to `${SERVER}/api/races/${id}/accelerate`
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: 'POST',
    ...defaultFetchOpts(),
  })
    .then((res) => res)
    .catch((err) => console.log('Problem with accelerate request::', err))
}
