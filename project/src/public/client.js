/**
 * Store object template
 */
const store = {
    user: { name: "Student" },
    apod: '',
    currentRover: "",
    rovers: {
        Curiosity: {
            manifest: Immutable.Map(),
            images: Immutable.Map()
        },
        Opportunity: {
            manifest: Immutable.Map(),
            images: Immutable.Map()
        },
        Spirit: {
            manifest: Immutable.Map(),
            images: Immutable.Map()
        }
    }
}

/**
 * global state object
 */
let state = Immutable.Map(store);


// add our markup to the page
const root = document.getElementById('root')

/**
 * Updating the global object
 * @param {*} store current state object
 * @param {*} newState new state object or state object fragement
 * @param  {...any} path the path the the newState should be merged to, leave empty to adress the states root
 */
const updateStore = (store, newState, ...path) => {
    // store = Object.assign(store, newState)
    // render(root, store)
    if (!(store == undefined)) {
        state = state.mergeIn(path, newState);
    }
    render(root, state.toJS());
}

/**
 * render the page
 * @param {*} root 
 * @param {*} state 
 */
const render = async (root, state) => {
    root.innerHTML = App(state)
}


// create content
const App = (stateJson) => {
    let { rovers, apod } = stateJson

    return `
        <header></header>
        <main>
            ${TabStrip(state)}
            ${Greeting(stateJson.user.name)}
            ${GaleryTitle(stateJson)}
            ${RoverTiles(stateJson)}
        </main>
        <footer></footer>
    `
}

/**
 * create the tab strip from current state
 * @param {*} state 
 * @returns 
 */
const TabStrip = (state) => {
    const rovers = state.get("rovers");
    const rover_names = Object.keys(rovers);

    const buttons = rover_names.map(rover => `<button class="tablinks"onclick="switchRover(event, '${rover}')">${rover}</button>`);
    return `
        <div class="tabbedpane">
            ${buttons.reduce((previous, current) => current += previous, "")}
        </div>
    `;

}

/**
 * first HOF to render the gallery title
 * @param {*} rover 
 * @param {*} launchDate 
 * @param {*} landingDate 
 * @param {*} mostRecentPhotosDate 
 * @returns 
 */
const reusableGaleryTitle = function(rover, launchDate, landingDate, mostRecentPhotosDate) {
    this._rover = rover;
    this._launchDate = launchDate;
    this._landingDate = landingDate;
    this._mostRecentPhotosDate = mostRecentPhotosDate;
    return (_rover, _launchDate, _landingDate, _mostRecentPhotosDate) => {
        return `<h4>Images from Rover ${this._rover}, Launch Date: ${this._launchDate}, Landing Date: ${this._landingDate}, Most Recent Photos taken: ${this._mostRecentPhotosDate}</h4>`;
    }
}

/**
 * second HOF to render image tiles
 * @param {*} imageSource 
 * @param {*} cameraName 
 * @param {*} earthDate 
 * @returns 
 */
const reusablePhotoTile = function(imageSource, cameraName, earthDate) {
    this._imageSource = imageSource;
    this._cameraName = cameraName;
    this._earthDate = earthDate;
    return (_imageSource, _cameraName, _earthDate) => {
        return `
        <div class="tile">
        <a href="${this._imageSource}" target="_blank">
        <img class="tile-image" src="${this._imageSource}" height=300px width=300px>
        <div class="tile-info">Cam: ${this._cameraName}<br>
        Taken: ${this._earthDate}</div>
        </img>
        </a>

        </div>
        `;
    }
}


/**
 * create the gallery title
 * @param {*} stateJson 
 * @returns 
 */
const GaleryTitle = (stateJson) => {
    const { currentRover } = stateJson;
    if ( !( currentRover == undefined || currentRover == "" || Object.keys(stateJson.rovers[currentRover].manifest).length == 0 ) ) {
        const launchDate = stateJson.rovers[currentRover].manifest.response.photo_manifest.launch_date;
        const landingDate = stateJson.rovers[currentRover].manifest.response.photo_manifest.landing_date;
        const mostRecentPhotosDate = stateJson.rovers[currentRover].manifest.response.photo_manifest.max_date;
        // return `<h4>Images from Rover ${currentRover}, Launch Date: ${launchDate}, Landing Date: ${landingDate}, Most Recent Photos taken: ${mostRecentPhotosDate}</h4>`;
        return reusableGaleryTitle(currentRover,launchDate,landingDate,mostRecentPhotosDate)();
    } else {
        return "<h4>Please select a rover from the menu first.</h4>";
    }
}


/**
 * create the rover tiles
 * @param {*} stateJson 
 * @returns 
 */
const RoverTiles = (stateJson) => {
    const { currentRover } = stateJson;
    const rover = stateJson.rovers[currentRover];

    if (currentRover == null || rover == null) return "";

    if (Object.keys(rover.images).length == 0) {
        if (rover.manifest.response.photo_manifest.max_date != undefined) {

            const maxRoverDate = rover.manifest.response.photo_manifest.max_date;
            getImagesForRover(currentRover, maxRoverDate);
        }
    }
    if (Object.keys(rover.images).length > 0) {
        // debugger;
        let images = rover.images.response.photos;
        let html_tiles = images.map(image => reusablePhotoTile(image.img_src, image.camera.full_name, image.earthDate)());
        return html_tiles.reduce( (previous, current) => current+= previous );
    } else {
        return "";
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
const getImageOfTheDay = (stateJson) => {
    let { apod } = stateJson;

    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => updateStore(stateJson, { apod }))

    // return data
}

/**
 * get the manifest for the current selected rover
 * @param {*} rover 
 * @param {*} stateJson 
 */
const getManifestForRover = (rover, stateJson) => {
    fetch(`http://localhost:3000/api/mars-photos/api/v1/manifests/${rover}`)
        .then(res => res.json())
        // .then(roverManifest => updateStore(state, { manifests: { [`${rover}`]: roverManifest } } ))
        // .then(roverManifest => updateStore(state, { currentRover: rover,  [`${rover}`]: {manifest: roverManifest} }  ))
        .then(roverManifest => {
            // state.get("rovers")[rover] = state.get("rovers")[rover].set("manifest", roverManifest);
            updateStore(state, roverManifest, "rovers", rover, "manifest");
        })
}

/**
 * get the images for the current selected rovers
 * @param {*} rover 
 * @param {*} maxDate 
 */
const getImagesForRover = (rover, maxDate) => {
    fetch(`http://localhost:3000/api/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${maxDate}`)
        .then(res => res.json())
        // .then(images => updateStore(state, { [`${rover}`]: {images: images} } ));
        .then(images => {
            // state.rovers[rover].set("images", images);
            updateStore(state, images, "rovers", rover, "images");
        });
}

/**
 * event handler to switch the rover by manu bar
 * @param {*} event 
 * @param {*} rover 
 */
const switchRover = function (event, rover) {
    // alert(`switching to rover ${rover}`)
    updateStore(state, { currentRover: rover });
    getManifestForRover(rover, state);
}
