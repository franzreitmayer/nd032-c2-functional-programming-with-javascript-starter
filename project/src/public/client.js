
const store = {
    user: { name: "Student" },
    apod: '',
    currentRover: "",
    rovers: Immutable.Map( {
        'Curiosity': {
            metadata: Immutable.Map(),
            images: Immutable.Map()
        },
        'Opportunity': {
            metadata: Immutable.Map(),
            images: Immutable.Map()
        },
        'Spirit': {
            metadata: Immutable.Map(),
            images: Immutable.Map()
        }
    })
}

let state = Immutable.Map(store);


// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState) => {
    // store = Object.assign(store, newState)
    // render(root, store)
    state = state.merge(newState);
    render(root, state.toJSON());
}

const render = async(root, state) => {
    root.innerHTML = App(state)
}


// create content
const App = (state) => {
    let { rovers, apod } = state

    return `
        <header></header>
        <main>
            ${TabStrip(store)}
            ${Greeting(store.user.name)}
            ${RoverTiles(state)}
            <section>
                <h3>Put things on the page!</h3>
                <p>Here is an example section.</p>
                <p>
                    One of the most popular websites at NASA is the Astronomy Picture of the Day. In fact, this website is one of
                    the most popular websites across all federal agencies. It has the popular appeal of a Justin Bieber video.
                    This endpoint structures the APOD imagery and associated metadata so that it can be repurposed for other
                    applications. In addition, if the concept_tags parameter is set to True, then keywords derived from the image
                    explanation are returned. These keywords could be used as auto-generated hashtags for twitter or instagram feeds;
                    but generally help with discoverability of relevant imagery.
                </p>
                ${ImageOfTheDay(apod)}
            </section>
        </main>
        <footer></footer>
    `
}

const TabStrip = (state) => {
    const { rovers } = state;
    const roverNames = Object.keys(rovers.toJSON());

    const buttons = roverNames.map(rover => `<button class="tablinks"onclick="switchRover(event, '${rover}')">${rover}</button>`);
    return `
        <div class="tabbedpane">
            ${buttons.reduce( (previous, current) => current += previous, "")}
        </div>
    `;

}

const RoverTiles = (state) => {
    const { currentRover, rovers } = state;
    const rover = rovers[currentRover];

    if (currentRover == null || rover == null) return "";
    
    if (!rover.hasOwnProperty('images')) {
        const maxRoverDate = rover.manifest.response.photo_manifest.max_date;
        getImagesForRover(currentRover, maxRoverDate);
    }

}

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store)
})

// ------------------------------------------------------  COMPONENTS

// Pure function that renders conditional information -- THIS IS JUST AN EXAMPLE, you can delete it.
const Greeting = (name) => {
    if (name) {
        return `
            <h1>Welcome, ${name}!</h1>
        `
    }

    return `
        <h1>Hello!</h1>
    `
}

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date()
    const photodate = new Date(apod.date)
    //console.log(photodate.getDate(), today.getDate());

    console.log(photodate.getDate() === today.getDate());
    if (!apod || apod.image.date === today.getDate()) {
        getImageOfTheDay(store)
    }

    // check if the photo of the day is actually type video!
    if (apod.image.media_type === "video") {
        return (`
            <p>See today's featured video <a href="${apod.image.url}">here</a></p>
            <p>${apod.image.title}</p>
            <p>${apod.image.explanation}</p>
        `)
    } else {
        return (`
            <img src="${apod.image.url}" height="350px" width="100%" />
            <p>${apod.image.explanation}</p>
        `)
    }
}

// ------------------------------------------------------  API CALLS

// Example API call
const getImageOfTheDay = (state) => {
    let { apod } = state

    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => updateStore(store, { apod }))

    // return data
}

const getManifestForRover = (rover, state) => {
    fetch(`http://localhost:3000/api/mars-photos/api/v1/manifests/${rover}`)
        .then(res => res.json())
        // .then(roverManifest => updateStore(state, { manifests: { [`${rover}`]: roverManifest } } ))
        .then(roverManifest => updateStore(state, { currentRover: rover, rovers: { [`${rover}`]: {manifest: roverManifest} } } ))
}

const getImagesForRover = (rover, maxDate) => {
    fetch(`http://localhost:3000/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${maxDate}`)
    .then(res => res.json())
    .then(data => console.log(data));
}

const switchRover = function(event, rover) {
    alert(`switching to rover ${rover}`)
    getManifestForRover(rover, state);
}
