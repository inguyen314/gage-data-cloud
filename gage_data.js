document.addEventListener('DOMContentLoaded', async function () {
    // Display the loading_alarm_mvs indicator
    const loadingIndicator = document.getElementById('loading_json');
    loadingIndicator.style.display = 'block';

    let setBaseUrl = null;
    if (cda === "internal") {
        setBaseUrl = `https://wm.${office.toLowerCase()}.ds.usace.army.mil:8243/${office.toLowerCase()}-data/`;
    } else if (cda === "internal-coop") {
        setBaseUrl = `https://wm-${office.toLowerCase()}coop.mvk.ds.usace.army.mil:8243/${office.toLowerCase()}-data/`;
    } else if (cda === "public") {
        setBaseUrl = `https://cwms-data.usace.army.mil/cwms-data/`;
    }
    console.log("setBaseUrl: ", setBaseUrl);

    if (json === "true" && (basin === "Mississippi" || basin === "Kaskaskia")) {
        fetch(`json/${basin}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(combinedData => {
                console.log('combinedData:', combinedData);

                // Call the function to create and populate the table
                createGageDataTable(combinedData, setBaseUrl);
                loadingIndicator.style.display = 'none';
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    } else {
        // Store location metadata and flood data
        const metadataMap = new Map();
        const floodMap = new Map();
        const stageTsidMap = new Map();
        const forecastNwsTsidMap = new Map();
        const flowTsidMap = new Map();
        const precipTsidMap = new Map();
        const tempAirTsidMap = new Map();
        const tempWaterTsidMap = new Map();
        const speedWindTsidMap = new Map();
        const dirWindTsidMap = new Map();
        const doTsidMap = new Map();
        const depthTsidMap = new Map();
        const condTsidMap = new Map();
        const phTsidMap = new Map();
        const turbfTsidMap = new Map();
        const pressureTsidMap = new Map();
        const nitrateTsidMap = new Map();
        const chlorophyllTsidMap = new Map();
        const phycocyaninTsidMap = new Map();
        const speedTsidMap = new Map();
        const ownerMap = new Map();
        const riverMileHardCodedMap = new Map();
        const riverMileMap = new Map();

        // Arrays to track promises for metadata and flood data fetches
        const metadataPromises = [];
        const floodPromises = [];
        const stageTsidPromises = [];
        const forecastNwsTsidPromises = [];
        const flowTsidPromises = [];
        const precipTsidPromises = [];
        const tempAirTsidPromises = [];
        const tempWaterTsidPromises = [];
        const speedWindTsidPromises = [];
        const dirWindTsidPromises = [];
        const doTsidPromises = [];
        const depthTsidPromises = [];
        const condTsidPromises = [];
        const phTsidPromises = [];
        const turbfTsidPromises = [];
        const pressureTsidPromises = [];
        const nitrateTsidPromises = [];
        const chlorophyllTsidPromises = [];
        const phycocyaninTsidPromises = [];
        const speedTsidPromises = [];
        const ownerPromises = [];
        const riverMileHardCodedPromises = [];
        const riverMilePromises = [];

        if (cda === "internal") {
            apiUrl = `${setBaseUrl}location/group?office=${office}&include-assigned=false&location-category-like=Basins`;
        } else if (cda === "public") {
            apiUrl = `${setBaseUrl}location/group?office=${office}&include-assigned=false&location-category-like=Basins`;
        }
        console.log("apiUrl: ", apiUrl);

        // Fetch the initial data
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) {
                    console.warn('No data available from the initial fetch.');
                    return;
                }
                // console.log('Data fetched:', data);

                const targetCategory = { "office-id": office, "id": "Basins" };

                const filteredArray = filterByLocationCategory(data, targetCategory);
                console.log("filteredArray: ", filteredArray);

                // Extract the "id" values from each object
                const basins = filteredArray.map(item => item.id);
                if (basins.length === 0) {
                    console.warn('No basins found for the given category.');
                    return;
                }

                console.log("basins: ", basins);

                const selectedBasin = basins.includes(basin) ? basin : null;

                console.log("selectedBasin: ", selectedBasin); // Output: "Mississippi"

                // Array to store all promises from API requests
                const apiPromises = [];
                const combinedData = []; // Array to store combined data

                // Construct the URL for the API request - basin
                let basinApiUrl = null;
                if (cda === "internal") {
                    basinApiUrl = `${setBaseUrl}location/group/${basin}?office=${office}&category-id=Basins`;
                } else if (cda === "public") {
                    basinApiUrl = `${setBaseUrl}location/group/${basin}?office=${office}&category-id=Basins`;
                }
                // console.log("basinApiUrl: ", basinApiUrl);

                // Push the fetch promise to the apiPromises array
                apiPromises.push(
                    fetch(basinApiUrl)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Network response was not ok for basin ${basin}: ${response.statusText}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (!data) {
                                console.log(`No data for basin: ${basin}`);
                                return;
                            }
                            console.log('data:', data);

                            // Ensure 'assigned-locations' is defined and is an array
                            if (Array.isArray(data['assigned-locations'])) {
                                // Create a new array for filtered assigned-locations
                                const filteredLocations = data['assigned-locations'].filter(location => location.attribute <= 900);

                                // Reorder filtered locations based on the "attribute" value
                                filteredLocations.sort((a, b) => a.attribute - b.attribute);
                                console.log('Filtered and sorted locations:', filteredLocations);

                                // If a specific gage is defined, filter further
                                if (gage) {
                                    // Filter for the specified gage
                                    const gageFilteredLocations = filteredLocations.filter(location => location["location-id"] === gage);
                                    console.log('Filtered data for gage:', gageFilteredLocations);

                                    // Update the assigned-locations in the original data object
                                    data['assigned-locations'] = gageFilteredLocations;
                                } else {
                                    // Update the assigned-locations in the original data object
                                    data['assigned-locations'] = filteredLocations;
                                }
                            } else {
                                console.log(`No assigned-locations found.`);
                            }

                            // Process and append the fetched data to combinedData
                            combinedData.push(data);

                            console.log('data push:', data);

                            // Process each location within the basin data
                            if (data['assigned-locations']) {
                                data['assigned-locations'].forEach(loc => {
                                    // console.log('Processing location:', loc['location-id']);

                                    // metadata request
                                    (() => {
                                        let locApiUrl = `${setBaseUrl}locations/${loc['location-id']}?office=${office}`;
                                        if (locApiUrl) {
                                            // Push the fetch promise to the metadataPromises array
                                            metadataPromises.push(
                                                fetch(locApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Location metadata not found for location: ${loc['location-id']}`);
                                                            return null; // Skip processing if no metadata is found
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(locData => {
                                                        if (locData) {
                                                            metadataMap.set(loc['location-id'], locData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for location ${loc['location-id']}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // flood data request
                                    (() => {
                                        let floodApiUrl = `${setBaseUrl}levels/${loc['location-id']}.Stage.Inst.0.Flood?office=${office}&effective-date=2024-01-01T08:00:00&unit=ft`;
                                        if (floodApiUrl) {
                                            // Push the fetch promise to the floodPromises array
                                            floodPromises.push(
                                                fetch(floodApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            // console.warn(`Flood data not found for location: ${loc['location-id']}`);
                                                            return null; // Skip processing if no flood data is found
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(floodData => {
                                                        if (floodData) {
                                                            floodMap.set(loc['location-id'], floodData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for flood data at ${floodApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // stage tsid data request
                                    (() => {
                                        let stageTsidApiUrl = `${setBaseUrl}timeseries/group/Stage?office=${office}&category-id=${loc['location-id']}`;
                                        if (stageTsidApiUrl) {
                                            stageTsidPromises.push(
                                                fetch(stageTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Stage TSID data not found for location: ${loc['location-id']}`);
                                                            return null; // Skip processing if no data is found
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(stageTsidData => {
                                                        if (stageTsidData) {
                                                            stageTsidMap.set(loc['location-id'], stageTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${stageTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // flow tsid data request
                                    (() => {
                                        let flowTsidApiUrl = `${setBaseUrl}timeseries/group/Flow?office=${office}&category-id=${loc['location-id']}`;
                                        if (flowTsidApiUrl) {
                                            flowTsidPromises.push(
                                                fetch(flowTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Flow TSID data not found for location: ${loc['location-id']}`);
                                                            return null; // Skip processing if no data is found
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(flowTsidData => {
                                                        if (flowTsidData) {
                                                            flowTsidMap.set(loc['location-id'], flowTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${flowTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // precip tsid data request
                                    (() => {
                                        let precipTsidApiUrl = `${setBaseUrl}timeseries/group/Precip?office=${office}&category-id=${loc['location-id']}`;
                                        if (precipTsidApiUrl) {
                                            precipTsidPromises.push(
                                                fetch(precipTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Precip TSID data not found for location: ${loc['location-id']}`);
                                                            return null; // Skip processing if no data is found
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(precipTsidData => {
                                                        if (precipTsidData) {
                                                            precipTsidMap.set(loc['location-id'], precipTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${precipTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // temp air tsid data request
                                    (() => {
                                        let tempAirTsidApiUrl = `${setBaseUrl}timeseries/group/Temp-Air?office=${office}&category-id=${loc['location-id']}`;
                                        if (tempAirTsidApiUrl) {
                                            tempAirTsidPromises.push(
                                                fetch(tempAirTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Air TSID data not found for location: ${loc['location-id']}`);
                                                            return null; // Skip processing if no data is found
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(tempAirTsidData => {
                                                        if (tempAirTsidData) {
                                                            tempAirTsidMap.set(loc['location-id'], tempAirTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${tempAirTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // temp water tsid data request
                                    (() => {
                                        let tempWaterTsidApiUrl = `${setBaseUrl}timeseries/group/Temp-Water?office=${office}&category-id=${loc['location-id']}`;
                                        if (tempWaterTsidApiUrl) {
                                            tempWaterTsidPromises.push(
                                                fetch(tempWaterTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null; // Skip processing if no data is found
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(tempWaterTsidData => {
                                                        if (tempWaterTsidData) {
                                                            tempWaterTsidMap.set(loc['location-id'], tempWaterTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${tempWaterTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // forecast nws tsid data request
                                    (() => {
                                        let forecastNwsTsidApiUrl = `${setBaseUrl}timeseries/group/Forecast-NWS?office=${office}&category-id=${loc['location-id']}`;
                                        if (forecastNwsTsidApiUrl) {
                                            tempAirTsidPromises.push(
                                                fetch(forecastNwsTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Stage TSID data not found for location: ${loc['location-id']}`);
                                                            return null; // Skip processing if no data is found
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(forecastNwsTsidData => {
                                                        if (forecastNwsTsidData) {
                                                            forecastNwsTsidMap.set(loc['location-id'], forecastNwsTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${forecastNwsTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // speed wind tsid data request
                                    (() => {
                                        let speedWindTsidApiUrl = `${setBaseUrl}timeseries/group/Speed-Wind?office=${office}&category-id=${loc['location-id']}`;
                                        if (speedWindTsidApiUrl) {
                                            tempWaterTsidPromises.push(
                                                fetch(speedWindTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null; // Skip processing if no data is found
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(speedWindTsidData => {
                                                        if (speedWindTsidData) {
                                                            speedWindTsidMap.set(loc['location-id'], speedWindTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${speedWindTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // dir wind tsid data request
                                    (() => {
                                        let dirWindTsidApiUrl = `${setBaseUrl}timeseries/group/Dir-Wind?office=${office}&category-id=${loc['location-id']}`;
                                        if (dirWindTsidApiUrl) {
                                            tempWaterTsidPromises.push(
                                                fetch(dirWindTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(dirWindTsidData => {
                                                        if (dirWindTsidData) {
                                                            dirWindTsidMap.set(loc['location-id'], dirWindTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${dirWindTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // do tsid data request
                                    (() => {
                                        let doTsidApiUrl = `${setBaseUrl}timeseries/group/Conc-DO?office=${office}&category-id=${loc['location-id']}`;
                                        if (doTsidApiUrl) {
                                            doTsidPromises.push(
                                                fetch(doTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(doTsidData => {
                                                        if (doTsidData) {
                                                            doTsidMap.set(loc['location-id'], doTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${doTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // depth tsid data request
                                    (() => {
                                        let depthTsidApiUrl = `${setBaseUrl}timeseries/group/Depth?office=${office}&category-id=${loc['location-id']}`;
                                        if (depthTsidApiUrl) {
                                            depthTsidPromises.push(
                                                fetch(depthTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(depthTsidData => {
                                                        if (depthTsidData) {
                                                            depthTsidMap.set(loc['location-id'], depthTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${depthTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // cond tsid data request
                                    (() => {
                                        let condTsidApiUrl = `${setBaseUrl}timeseries/group/Cond?office=${office}&category-id=${loc['location-id']}`;
                                        if (condTsidApiUrl) {
                                            condTsidPromises.push(
                                                fetch(condTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(condTsidData => {
                                                        if (condTsidData) {
                                                            condTsidMap.set(loc['location-id'], condTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${condTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // ph tsid data request
                                    (() => {
                                        let phTsidApiUrl = `${setBaseUrl}timeseries/group/pH?office=${office}&category-id=${loc['location-id']}`;
                                        if (phTsidApiUrl) {
                                            phTsidPromises.push(
                                                fetch(phTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(phTsidData => {
                                                        if (phTsidData) {
                                                            phTsidMap.set(loc['location-id'], phTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${phTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // turbf tsid data request
                                    (() => {
                                        let turbfTsidApiUrl = `${setBaseUrl}timeseries/group/TurbF?office=${office}&category-id=${loc['location-id']}`;
                                        if (turbfTsidApiUrl) {
                                            turbfTsidPromises.push(
                                                fetch(turbfTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(turbfTsidData => {
                                                        if (turbfTsidData) {
                                                            turbfTsidMap.set(loc['location-id'], turbfTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${turbfTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // pressure tsid data request
                                    (() => {
                                        let pressureTsidApiUrl = `${setBaseUrl}timeseries/group/Pres?office=${office}&category-id=${loc['location-id']}`;
                                        if (pressureTsidApiUrl) {
                                            pressureTsidPromises.push(
                                                fetch(pressureTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(pressureTsidData => {
                                                        if (pressureTsidData) {
                                                            pressureTsidMap.set(loc['location-id'], pressureTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${pressureTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // nitrate tsid data request
                                    (() => {
                                        let nitrateTsidApiUrl = `${setBaseUrl}timeseries/group/Conc-Nitrate?office=${office}&category-id=${loc['location-id']}`;
                                        if (nitrateTsidApiUrl) {
                                            nitrateTsidPromises.push(
                                                fetch(nitrateTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(nitrateTsidData => {
                                                        if (nitrateTsidData) {
                                                            nitrateTsidMap.set(loc['location-id'], nitrateTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${nitrateTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // chlorophyll tsid data request
                                    (() => {
                                        let chlorophyllTsidApiUrl = `${setBaseUrl}timeseries/group/Conc-Chlorophyll?office=${office}&category-id=${loc['location-id']}`;
                                        if (chlorophyllTsidApiUrl) {
                                            chlorophyllTsidPromises.push(
                                                fetch(chlorophyllTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(chlorophyllTsidData => {
                                                        if (chlorophyllTsidData) {
                                                            chlorophyllTsidMap.set(loc['location-id'], chlorophyllTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${chlorophyllTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // phycocyanin tsid data request
                                    (() => {
                                        let phycocyaninTsidApiUrl = `${setBaseUrl}timeseries/group/Conc-Phycocyanin?office=${office}&category-id=${loc['location-id']}`;
                                        if (phycocyaninTsidApiUrl) {
                                            phycocyaninTsidPromises.push(
                                                fetch(phycocyaninTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(phycocyaninTsidData => {
                                                        if (phycocyaninTsidData) {
                                                            phycocyaninTsidMap.set(loc['location-id'], phycocyaninTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${phycocyaninTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // speed tsid data request
                                    (() => {
                                        let speedTsidApiUrl = `${setBaseUrl}timeseries/group/Speed?office=${office}&category-id=${loc['location-id']}`;
                                        if (speedTsidApiUrl) {
                                            speedTsidPromises.push(
                                                fetch(speedTsidApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(speedTsidData => {
                                                        if (speedTsidData) {
                                                            speedTsidMap.set(loc['location-id'], speedTsidData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${speedTsidApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // owner data request
                                    (() => {
                                        let ownerApiUrl = `https://coe-mvsuwa04${office.toLocaleLowerCase()}.${office.toLocaleLowerCase()}.usace.army.mil:8243/${office.toLocaleLowerCase()}-data/location/group/${office}?office=${office}&category-id=${office}`;
                                        if (ownerApiUrl) {
                                            ownerPromises.push(
                                                fetch(ownerApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`Temp-Water TSID data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(ownerData => {
                                                        if (ownerData) {
                                                            // console.log("ownerData", ownerData);
                                                            ownerMap.set(loc['location-id'], ownerData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for stage TSID data at ${ownerApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();

                                    // river mile data hard coded request
                                    (() => {
                                        // Fetch the JSON file
                                        fetch('json/gage_control_official.json')
                                            .then(response => {
                                                if (!response.ok) {
                                                    throw new Error(`Network response was not ok: ${response.statusText}`);
                                                }
                                                return response.json();
                                            })
                                            .then(riverMilesJson => {
                                                // Loop through each basin in the JSON
                                                for (const basin in riverMilesJson) {
                                                    const locations = riverMilesJson[basin];

                                                    for (const loc in locations) {
                                                        const ownerData = locations[loc];

                                                        // Retrieve river mile and other data
                                                        const riverMile = ownerData.river_mile_hard_coded;

                                                        // Create an output object using the location name as ID
                                                        const outputData = {
                                                            locationId: loc, // Using location name as ID
                                                            basin: basin,
                                                            riverMile: riverMile
                                                        };

                                                        // console.log("Output Data:", outputData);
                                                        riverMileHardCodedMap.set(loc, ownerData); // Store the data in the map
                                                    }
                                                }
                                            })
                                            .catch(error => {
                                                console.error('Problem with the fetch operation:', error);
                                            });
                                    })();

                                    // river mile data request
                                    (() => {
                                        let riverMileApiUrl = `https://coe-mvsuwa04${office.toLocaleLowerCase()}.${office.toLocaleLowerCase()}.usace.army.mil:8243/${office.toLocaleLowerCase()}-data/stream-locations?office-mask=MVS`;
                                        if (riverMileApiUrl) {
                                            riverMilePromises.push(
                                                fetch(riverMileApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            console.warn(`River Mile data not found for location: ${loc['location-id']}`);
                                                            return null;
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(riverMileData => {
                                                        if (riverMileData) {
                                                            // console.log("riverMileData: ", riverMileData);
                                                            riverMileMap.set(loc['location-id'], riverMileData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for river mile data at ${riverMileApiUrl}:`, error);
                                                    })
                                            );
                                        }
                                    })();
                                });
                            }
                        })
                        .catch(error => {
                            console.error(`Problem with the fetch operation for basin ${basin}:`, error);
                        })
                );

                // Wait for all basin, metadata, and flood fetch promises to complete
                Promise.all(apiPromises)
                    .then(() => Promise.all(metadataPromises))
                    .then(() => Promise.all(floodPromises))
                    .then(() => Promise.all(stageTsidPromises))
                    .then(() => Promise.all(forecastNwsTsidPromises))
                    .then(() => Promise.all(flowTsidPromises))
                    .then(() => Promise.all(precipTsidPromises))
                    .then(() => Promise.all(tempAirTsidPromises))
                    .then(() => Promise.all(tempWaterTsidPromises))
                    .then(() => Promise.all(speedWindTsidPromises))
                    .then(() => Promise.all(dirWindTsidPromises))
                    .then(() => Promise.all(doTsidPromises))
                    .then(() => Promise.all(depthTsidPromises))
                    .then(() => Promise.all(condTsidPromises))
                    .then(() => Promise.all(phTsidPromises))
                    .then(() => Promise.all(turbfTsidPromises))
                    .then(() => Promise.all(pressureTsidPromises))
                    .then(() => Promise.all(nitrateTsidPromises))
                    .then(() => Promise.all(chlorophyllTsidPromises))
                    .then(() => Promise.all(phycocyaninTsidPromises))
                    .then(() => Promise.all(speedTsidPromises))
                    .then(() => Promise.all(ownerPromises))
                    .then(() => Promise.all(riverMileHardCodedPromises))
                    .then(() => Promise.all(riverMilePromises))
                    .then(() => {
                        // Update combinedData with location metadata and flood data
                        combinedData.forEach(basinData => {
                            if (basinData['assigned-locations']) {
                                basinData['assigned-locations'].forEach(loc => {
                                    // append data to main basin
                                    (() => {
                                        const metadataMapData = metadataMap.get(loc['location-id']);
                                        if (metadataMapData) {
                                            loc['metadata'] = metadataMapData;
                                        }

                                        const floodMapData = floodMap.get(loc['location-id']);
                                        if (floodMapData) {
                                            loc['flood'] = floodMapData;
                                        }

                                        const stageTsidMapData = stageTsidMap.get(loc['location-id']);
                                        if (stageTsidMapData) {
                                            loc['tsid-stage'] = stageTsidMapData;
                                        }

                                        const flowTsidMapData = flowTsidMap.get(loc['location-id']);
                                        if (flowTsidMapData) {
                                            loc['tsid-flow'] = flowTsidMapData;
                                        }

                                        const precipTsidMapData = precipTsidMap.get(loc['location-id']);
                                        if (precipTsidMapData) {
                                            loc['tsid-precip'] = precipTsidMapData;
                                        }

                                        const tempAirTsidMapData = tempAirTsidMap.get(loc['location-id']);
                                        if (tempAirTsidMapData != null) {
                                            loc['tsid-temp-air'] = tempAirTsidMapData;
                                        } else {
                                            loc['tsid-temp-air'] = null;
                                        }

                                        const tempWaterTsidMapData = tempWaterTsidMap.get(loc['location-id']);
                                        if (tempWaterTsidMapData) {
                                            loc['tsid-temp-water'] = tempWaterTsidMapData;
                                        }

                                        const forecastNwsTsidMapData = forecastNwsTsidMap.get(loc['location-id']);
                                        if (forecastNwsTsidMapData) {
                                            loc['tsid-forecast-nws'] = forecastNwsTsidMapData;
                                        }

                                        const speedWindTsidMapData = speedWindTsidMap.get(loc['location-id']);
                                        if (speedWindTsidMapData) {
                                            loc['tsid-speed-wind'] = speedWindTsidMapData;
                                        }

                                        const dirWindTsidMapData = dirWindTsidMap.get(loc['location-id']);
                                        if (dirWindTsidMapData) {
                                            loc['tsid-dir-wind'] = dirWindTsidMapData;
                                        }

                                        const doTsidMapData = doTsidMap.get(loc['location-id']);
                                        if (doTsidMapData) {
                                            loc['tsid-do'] = doTsidMapData;
                                        }

                                        const depthTsidMapData = depthTsidMap.get(loc['location-id']);
                                        if (depthTsidMapData) {
                                            loc['tsid-depth'] = depthTsidMapData;
                                        }

                                        const condTsidMapData = condTsidMap.get(loc['location-id']);
                                        if (condTsidMapData) {
                                            loc['tsid-cond'] = condTsidMapData;
                                        }

                                        const phTsidMapData = phTsidMap.get(loc['location-id']);
                                        if (phTsidMapData) {
                                            loc['tsid-ph'] = phTsidMapData;
                                        }

                                        const turbfTsidMapData = turbfTsidMap.get(loc['location-id']);
                                        if (turbfTsidMapData) {
                                            loc['tsid-turbf'] = turbfTsidMapData;
                                        }

                                        const pressureTsidMapData = pressureTsidMap.get(loc['location-id']);
                                        if (pressureTsidMapData) {
                                            loc['tsid-pressure'] = pressureTsidMapData;
                                        }

                                        const nitrateTsidMapData = nitrateTsidMap.get(loc['location-id']);
                                        if (nitrateTsidMapData) {
                                            loc['tsid-nitrate'] = nitrateTsidMapData;
                                        }

                                        const chlorophyllTsidMapData = chlorophyllTsidMap.get(loc['location-id']);
                                        if (chlorophyllTsidMapData) {
                                            loc['tsid-chlorophyll'] = chlorophyllTsidMapData;
                                        }

                                        const phycocyaninTsidMapData = phycocyaninTsidMap.get(loc['location-id']);
                                        if (phycocyaninTsidMapData) {
                                            loc['tsid-phycocyanin'] = phycocyaninTsidMapData;
                                        }

                                        const speedTsidMapData = speedTsidMap.get(loc['location-id']);
                                        if (speedTsidMapData) {
                                            loc['tsid-speed'] = speedTsidMapData;
                                        }

                                        const ownerMapData = ownerMap.get(loc['location-id']);
                                        if (ownerMapData) {
                                            loc['owner'] = ownerMapData;
                                        }

                                        const riverMileHardCodedMapData = riverMileHardCodedMap.get(loc['location-id']);
                                        if (riverMileHardCodedMapData) {
                                            loc['river-mile-hard-coded'] = riverMileHardCodedMapData;
                                        }

                                        const riverMileMapData = riverMileMap.get(loc['location-id']);
                                        if (riverMileMapData) {
                                            loc['river-mile'] = riverMileMapData;
                                        }
                                    })();
                                });
                            }
                        });

                        // Output the combined data
                        console.log('combinedData:', combinedData);

                        // Call the function to create and populate the table
                        createGageDataTable(combinedData, setBaseUrl);
                        loadingIndicator.style.display = 'none';
                    })
                    .catch(error => {
                        console.error('There was a problem with one or more fetch operations:', error);
                    });

            })
            .catch(error => {
                console.error('There was a problem with the initial fetch operation:', error);
            });
    }
});
/******************************************************************************
 *                               CREATE TABLE FUNCTIONS                       *
 ******************************************************************************/
function createGageDataTable(allData, setBaseUrl) {
    // Create a table element
    const table = document.createElement('table');
    table.setAttribute('id', 'gage_data'); // Set the id to "customers"

    // Create a table header row
    const headerRow = document.createElement('tr');

    // Create table headers for the desired columns
    let columns = null;
    if (office === "MVS") {
        columns = ["Gage", "Stage (24hr)", "Flow (24hr)", "Precip [6hr] [24hr]", "Water Quality", "River Mile", "Flood Level"];
    } else {
        columns = ["Gage", "Stage (24hr)", "Flow (24hr)", "Precip [6hr] [24hr]", "Water Quality", "Gage Zero", "Flood Level"];
    }

    columns.forEach((columnName) => {
        const th = document.createElement('th');
        th.textContent = columnName;
        if (cda === "public" || cda === "internal") {
            th.style.height = '50px';
            th.style.backgroundColor = 'darkblue'; // Set background color to dark blue
            th.style.color = 'white';
        } else {
            th.style.height = '50px';
        }
        headerRow.appendChild(th);
    });

    // Append the header row to the table
    table.appendChild(headerRow);

    // Get current date and time
    const currentDateTime = new Date();
    // console.log('currentDateTime:', currentDateTime);

    // Subtract two hours from current date and time
    const currentDateTimeMinus2Hours = subtractHoursFromDate(currentDateTime, 2);
    // console.log('currentDateTimeMinus2Hours :', currentDateTimeMinus2Hours);

    // Subtract two hours from current date and time
    const currentDateTimeMinus8Hours = subtractHoursFromDate(currentDateTime, 8);
    // console.log('currentDateTimeMinus8Hours :', currentDateTimeMinus8Hours);

    // Subtract thirty hours from current date and time
    const currentDateTimeMinus30Hours = subtractHoursFromDate(currentDateTime, 64);
    // console.log('currentDateTimeMinus30Hours :', currentDateTimeMinus30Hours);

    // Add thirty hours to current date and time
    const currentDateTimePlus30Hours = plusHoursFromDate(currentDateTime, 30);
    // console.log('currentDateTimePlus30Hours :', currentDateTimePlus30Hours);

    // Add four days to current date and time
    const currentDateTimePlus4Days = addDaysToDate(currentDateTime, 4);
    // console.log('currentDateTimePlus4Days :', currentDateTimePlus4Days);

    // Sort assigned-locations by the attribute in assigned-time-series
    // allData.forEach(item => {
    //     item[`assigned-locations`].sort((a, b) => {
    //         const aAttribute = a.tsid-stage['assigned-time-series'][0].attribute;
    //         const bAttribute = b.tsid-stage['assigned-time-series'][0].attribute;
    //         return aAttribute - bAttribute;
    //     });
    // });

    // Log sorted allData
    // console.log("Sorted allData:", JSON.stringify(allData, null, 2));

    // Iterate through the mergedData to populate the table
    for (const locData of allData[0][`assigned-locations`]) {
        // console.log("locData:", locData);

        // HIDE LOCATION BASED ON VISIBLE
        if (locData.visible !== false) {
            const row = table.insertRow(); // Insert a new row for each loc

            let flood_level = null;
            // Check if locData has the 'flood' property and if its 'constant-value' is not null
            if (locData.flood && locData.flood[`constant-value`] !== null) {
                // Check conditions for flood level value and format it to two decimal places if it falls within range
                if (
                    locData.flood[`constant-value`] === null ||
                    locData.flood[`constant-value`].toFixed(2) == 0.00 ||
                    locData.flood[`constant-value`].toFixed(2) > 900
                ) {
                    flood_level = null; // If flood level is null or outside range, set flood_level to an empty string
                } else {
                    flood_level = parseFloat(locData.flood[`constant-value`]).toFixed(2); // Otherwise, format flood level to two decimal places
                }
            } else {
                flood_level = null;
            }
            // console.log("flood_level:", flood_level);

            // LOCATION
            (() => {
                // Create a new table cell for displaying location data
                const locationCell = row.insertCell();
                locationCell.style.textAlign = 'left';
                locationCell.style.fontWeight = 'bold';

                // Assuming locData is defined and populated as you provided
                const assignedLocations = locData.owner?.['assigned-locations']?.map(location => location['location-id']) || [];

                // Check if the location-id exists in the assigned locations
                if (assignedLocations.includes(locData['location-id'])) {
                    // If the owner's ID is "MVS", set the text color to dark blue
                    locationCell.style.color = 'darkblue';

                    // Create a link with location-id (gage)
                    const locationLink = document.createElement('a');
                    // Make the link open in a new tab
                    locationLink.target = '_blank';
                    locationLink.href = `../metadata?office=MVS&type=data&gage=${encodeURIComponent(locData['location-id'])}`;
                    locationLink.textContent = Math.round(locData.attribute) + " " + locData['location-id'];

                    locationCell.appendChild(locationLink); // Append the link to the cell
                } else {
                    locationCell.innerHTML = Math.round(locData.attribute) + " " + locData['location-id'];
                }
            })();

            // STAGE
            (() => {
                // Create a new table cell for displaying stage data
                const stageCell = row.insertCell();
                const containerDiv = document.createElement('div');
                containerDiv.className = 'container'; // Create and set the container div class

                // Create three divs for top, middle, and bottom
                const topDiv = document.createElement('div');
                const middleDiv = document.createElement('div');
                const bottomDiv = document.createElement('div');

                topDiv.className = 'box top';
                middleDiv.className = 'box middle';
                bottomDiv.className = 'box bottom';

                let tsidStage = null;
                let tsidForecastNws = null;

                if (locData.attribute.toString().endsWith('.1')) {
                    topDiv.innerHTML = "Temporally Removed<br>Loss of Funding";
                } else {
                    // Check if 'tsid-stage' exists in locData
                    if (locData['tsid-stage']) {
                        tsidStage = locData['tsid-stage']['assigned-time-series'][0]['timeseries-id'];
                        // fetchAndUpdateStage(stageCell, tsidStage, flood_level, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours);
                        fetchAndUpdateStage(topDiv, tsidStage, flood_level, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, setBaseUrl);
                    }

                    // Check if the office is "MVS" and other conditions
                    if (office === "MVS") {
                        if (locData['tsid-forecast-nws'] && cda === "internal") {
                            tsidForecastNws = locData['tsid-forecast-nws']['assigned-time-series'][0]['timeseries-id'];
                            fetchAndUpdateNWS(middleDiv, tsidStage, tsidForecastNws, flood_level, currentDateTime, currentDateTimePlus4Days, setBaseUrl);
                            fetchAndUpdateNWSForecastDate(bottomDiv, tsidForecastNws);
                        }
                    }
                }

                // Append the divs to the container
                containerDiv.appendChild(topDiv);
                containerDiv.appendChild(middleDiv);
                containerDiv.appendChild(bottomDiv);

                // Append the container to the stageCell
                stageCell.appendChild(containerDiv);
            })();

            // FLOW
            (() => {
                const flowCell = row.insertCell();
                if (locData['tsid-flow']) {
                    const series = locData['tsid-flow']['assigned-time-series'];
                    if (series.length > 0) {
                        series.sort((a, b) => a.attribute - b.attribute);

                        // Determine how many series to show based on the value of cda
                        const limit = (cda === 'public') ? 1 : series.length;

                        for (let i = 0; i < limit; i++) {
                            if (locData.attribute.toString().endsWith('.1')) {
                                flowCell.innerHTML = "Temporally Removed<br>Loss of Funding";
                            } else {
                                const { 'timeseries-id': tsidFlow, 'alias-id': tsidFlowLabel } = series[i];
                                fetchAndUpdateFlow(flowCell, tsidFlow, tsidFlowLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, setBaseUrl);
                            }
                        }
                    }
                }
            })();

            // PRECIP
            (() => {
                const precipCell = row.insertCell();
                if (locData['tsid-precip']) {
                    if (locData['tsid-precip'][`assigned-time-series`][0]) {
                        if (locData.attribute.toString().endsWith('.1')) {
                            precipCell.innerHTML = "Temporally Removed<br>Loss of Funding";
                        } else {
                            const tsidPrecip = locData['tsid-precip'][`assigned-time-series`][0][`timeseries-id`];
                            fetchAndUpdatePrecip(precipCell, tsidPrecip, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, setBaseUrl);
                        }
                    }
                }
            })();

            // WATER QUALITY
            (() => {
                const waterQualityCell = row.insertCell();
                if (locData.attribute.toString().endsWith('.1')) {
                    waterQualityCell.innerHTML = "Temporally Removed<br>Loss of Funding";
                } else {
                    if (locData['tsid-temp-air']) {
                        const series = locData['tsid-temp-air']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : series.length;

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidTempAir, 'alias-id': tsidTempAirLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidTempAir, tsidTempAirLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-temp-water']) {
                        const series = locData['tsid-temp-water']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : Math.min(4, series.length);

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidTempWater, 'alias-id': tsidTempWaterLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidTempWater, tsidTempWaterLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-speed-wind']) {
                        const series = locData['tsid-speed-wind']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : Math.min(4, series.length);

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidSpeedWind, 'alias-id': tsidSpeedWindLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidSpeedWind, tsidSpeedWindLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-dir-wind']) {
                        const series = locData['tsid-dir-wind']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : Math.min(4, series.length);

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidDirWind, 'alias-id': tsidDirWindLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidDirWind, tsidDirWindLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-do']) {
                        const series = locData['tsid-do']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : Math.min(4, series.length);

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidDo, 'alias-id': tsidDoLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidDo, tsidDoLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-depth']) {
                        const series = locData['tsid-depth']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : Math.min(4, series.length);

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidDepth, 'alias-id': tsidDepthLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidDepth, tsidDepthLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-cond']) {
                        const series = locData['tsid-cond']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : Math.min(4, series.length);

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidCond, 'alias-id': tsidCondLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidCond, tsidCondLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-ph']) {
                        const series = locData['tsid-ph']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : Math.min(4, series.length);

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidPh, 'alias-id': tsidPhLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidPh, tsidPhLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-turbf']) {
                        const series = locData['tsid-turbf']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : series.length;

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidturbf, 'alias-id': tsidturbfLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidturbf, tsidturbfLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-pressure']) {
                        const series = locData['tsid-pressure']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : series.length;

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidpressure, 'alias-id': tsidpressureLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidpressure, tsidpressureLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-nitrate']) {
                        const series = locData['tsid-nitrate']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : series.length;

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidnitrate, 'alias-id': tsidnitrateLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidnitrate, tsidnitrateLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-chlorophyll']) {
                        const series = locData['tsid-chlorophyll']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : series.length;

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidchlorophyll, 'alias-id': tsidchlorophyllLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidchlorophyll, tsidchlorophyllLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-phycocyanin']) {
                        const series = locData['tsid-phycocyanin']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : series.length;

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidphycocyanin, 'alias-id': tsidphycocyaninLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidphycocyanin, tsidphycocyaninLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                    if (locData['tsid-speed']) {
                        const series = locData['tsid-speed']['assigned-time-series'];
                        if (series.length > 0) {
                            series.sort((a, b) => a.attribute - b.attribute);

                            // Determine how many series to show based on the value of cda
                            const limit = (cda === 'public') ? 1 : series.length;

                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidspeed, 'alias-id': tsidspeedLabel } = series[i];
                                fetchAndUpdateWaterQuality(waterQualityCell, tsidspeed, tsidspeedLabel, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl);
                            }
                        }
                    }
                }
            })();

            // GAGE-ZERO/RIVER-MILE
            (() => {
                const riverMileCell = row.insertCell();
                if (office === "MVS") {
                    // // Hard Coded River Mile
                    // if (locData[`river-mile-hard-coded`].river_mile_hard_coded !== null) {
                    //     riverMileCell.innerHTML = "<span class='hard_coded'>" + locData[`river-mile-hard-coded`].river_mile_hard_coded + "</span>"
                    // } else {
                    //     riverMileCell.innerHTML = "--";
                    // }

                    // console.log("Full locData object:", JSON.stringify(locData, null, 2));
                    // console.log("locData['river-mile']:", locData['river-mile']);
                    // console.log("Type of locData['river-mile']:", typeof locData['river-mile']);
                    // console.log("Is locData['river-mile'] an array?", Array.isArray(locData['river-mile']));

                    const locationId = locData[`location-id`];
                    const riverMileObject = locData?.["river-mile"] ?? locData?.["River-Mile"] ?? [];
                    const riverMileValue = getStationForLocation(locationId, riverMileObject);
                    riverMileCell.textContent = riverMileValue != null ? parseFloat(riverMileValue).toFixed(1) : "N/A";
                } else {
                    if (locData.metadata[`vertical-datum`] !== null && locData.metadata.elevation !== undefined && locData.metadata.elevation < 900) {
                        riverMileCell.innerHTML = (locData.metadata.elevation).toFixed(2) + " (" + locData.metadata[`vertical-datum`] + ")";
                    } else {
                        riverMileCell.innerHTML = "--";
                    }
                }
            })();

            // FLOOD LEVEL
            (() => {
                const floodCell = row.insertCell();
                floodCell.innerHTML = flood_level;
            })();
        }
    };

    // Append the table to the document or a specific container
    const tableContainer = document.getElementById('table_container_gage_data_cda');
    // console.log("Table container:", tableContainer); // Check if the container element is found
    if (tableContainer) {
        tableContainer.appendChild(table);
    }
}

/******************************************************************************
 *                               FETCH CDA FUNCTIONS                          *
 ******************************************************************************/
function fetchAndUpdateStage(stageCell, tsidStage, flood_level, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, setBaseUrl) {
    if (tsidStage !== null) {
        // Fetch the time series data from the API using the determined query string
        const urlStage = `${setBaseUrl}timeseries?name=${tsidStage}&begin=${currentDateTimeMinus30Hours.toISOString()}&end=${currentDateTime.toISOString()}&office=${office}`;

        // console.log("urlStage = ", urlStage);
        fetch(urlStage, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;version=2'
            }
        })
            .then(response => {
                // Check if the response is ok
                if (!response.ok) {
                    // If not, throw an error
                    throw new Error('Network response was not ok');
                }
                // If response is ok, parse it as JSON
                return response.json();
            })
            .then(stage => {
                // console.log("stage:", stage);

                // Convert timestamps in the JSON object
                stage.values.forEach(entry => {
                    entry[0] = formatNWSDate(entry[0]); // Update timestamp
                });

                // Output the updated JSON object
                // // console.log(JSON.stringify(stage, null, 2));

                // console.log("stageFormatted = ", stage);


                // Get the last non-null value from the stage data
                const lastNonNullValue = getLastNonNullValue(stage);
                // console.log("lastNonNullValue:", lastNonNullValue);

                // Check if a non-null value was found
                if (lastNonNullValue !== null) {
                    // Extract timestamp, value, and quality code from the last non-null value
                    var timestampLast = lastNonNullValue.timestamp;
                    var valueLast = parseFloat(lastNonNullValue.value).toFixed(2);
                    var qualityCodeLast = lastNonNullValue.qualityCode;

                    // Log the extracted valueLasts
                    // console.log("timestampLast:", timestampLast);
                    // console.log("valueLast:", valueLast);
                    // console.log("qualityCodeLast:", qualityCodeLast);
                } else {
                    // If no non-null valueLast is found, log a message
                    // console.log("No non-null valueLast found.");
                }

                const c_count = calculateCCount(tsidStage);
                // console.log("c_count:", c_count);


                const lastNonNull24HoursValue = getLastNonNull24HoursValue(stage, c_count);
                // console.log("lastNonNull24HoursValue:", lastNonNull24HoursValue);

                // Check if a non-null value was found
                if (lastNonNull24HoursValue !== null) {
                    // Extract timestamp, value, and quality code from the last non-null value
                    var timestamp24HoursLast = lastNonNull24HoursValue.timestamp;
                    var value24HoursLast = parseFloat(lastNonNull24HoursValue.value).toFixed(2);
                    var qualityCode24HoursLast = lastNonNull24HoursValue.qualityCode;

                    // Log the extracted valueLasts
                    // console.log("timestamp24HoursLast:", timestamp24HoursLast);
                    // console.log("value24HoursLast:", value24HoursLast);
                    // console.log("qualityCode24HoursLast:", qualityCode24HoursLast);
                } else {
                    // If no non-null valueLast is found, log a message
                    // console.log("No non-null valueLast found.");
                }


                // Calculate the 24 hours change between first and last value
                const delta_24 = (valueLast - value24HoursLast).toFixed(2);
                // console.log("delta_24:", delta_24);

                // Format the last valueLast's timestampLast to a string
                const formattedLastValueTimeStamp = formatTimestampToStringIOS(timestampLast);
                // console.log("formattedLastValueTimeStamp = ", formattedLastValueTimeStamp);

                // Create a Date object from the timestampLast
                const timeStampDateObject = new Date(timestampLast);
                // console.log("timeStampDateObject = ", timeStampDateObject);

                // Subtract 24 hours (24 * 60 * 60 * 1000 milliseconds) from the timestampLast date
                const timeStampDateObjectMinus24Hours = new Date(timestampLast - (24 * 60 * 60 * 1000));
                // console.log("timeStampDateObjectMinus24Hours = ", timeStampDateObjectMinus24Hours);


                // FLOOD CLASS
                var floodClass = determineStageClass(valueLast, flood_level);
                // console.log("floodClass:", floodClass);

                // DATATIME CLASS
                var dateTimeClass = determineDateTimeClass(timeStampDateObject, currentDateTimeMinus2Hours);
                // console.log("dateTimeClass:", dateTimeClass);

                if (valueLast === null) {
                    // innerHTMLStage = "-M-";
                    innerHTMLStage = "<span class='missing'>"
                        + "-M-"
                        + "</span>"
                        + "<span class='temp_water'>"
                        + "label"
                        + "</span>";
                } else {
                    // innerHTMLStage = lastValue.toFixed(2)
                    innerHTMLStage = "<span class='" + floodClass + "' title='" + stage.name + ", Value = " + valueLast + ", Date Time = " + timestampLast + "'>"
                        + "<a href='../chart?office=" + office + "&cwms_ts_id=" + stage.name + "&lookback=4&cda=internal' target='_blank'>"
                        + valueLast
                        + "</a>"
                        + "</span>"
                        + " "
                        + stage.units
                        + " (" + "<span title='" + stage.name + ", Value = " + value24HoursLast + ", Date Time = " + timestamp24HoursLast + ", Delta = (" + valueLast + " - " + value24HoursLast + ") = " + delta_24 + "'>" + delta_24 + "</span>" + ")"
                        + "<br>"
                        + "<span class='" + dateTimeClass + "'>"
                        + formattedLastValueTimeStamp
                        + "</span>";
                }
                return stageCell.innerHTML += innerHTMLStage;
            })
            .catch(error => {
                // Catch and log any errors that occur during fetching or processing
                console.error("Error fetching or processing data:", error);
            });
    }
}

function fetchAndUpdateNWS(stageCell, tsidStage, tsid_stage_nws_3_day_forecast, flood_level, currentDateTime, currentDateTimePlus4Days, setBaseUrl) {
    // Log current date and time
    // // console.log("currentDateTime = ", currentDateTime);
    // // console.log("currentDateTimePlus4Days = ", currentDateTimePlus4Days);

    const { currentDateTimeMidNightISO, currentDateTimePlus4DaysMidNightISO } = generateDateTimeMidNightStringsISO(currentDateTime, currentDateTimePlus4Days);
    // // console.log("currentDateTimeMidNightISO = ", currentDateTimeMidNightISO);
    // // console.log("currentDateTimePlus4DaysMidNightISO = ", currentDateTimePlus4DaysMidNightISO);

    let innerHTMLStage = ""; // Declare innerHTMLStage variable with a default value

    if (tsidStage !== null) {
        // // console.log("tsidStage:", tsidStage);
        // // console.log("tsidStage:", typeof (tsidStage));
        // // console.log("tsidStage:", tsidStage.slice(-2));

        if (tsidStage.slice(-2) !== "29" && tsid_stage_nws_3_day_forecast !== null) {

            // Fetch the time series data from the API using the determined query string
            const urlNWS = `${setBaseUrl}timeseries?name=${tsid_stage_nws_3_day_forecast}&begin=${currentDateTimeMidNightISO}&end=${currentDateTimePlus4DaysMidNightISO}&office=${office}`;

            // console.log("urlNWS = ", urlNWS);
            fetch(urlNWS, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;version=2'
                }
            })
                .then(response => {
                    // Check if the response is ok
                    if (!response.ok) {
                        // If not, throw an error
                        throw new Error('Network response was not ok');
                    }
                    // If response is ok, parse it as JSON
                    return response.json();
                })
                .then(nws3Days => {
                    // console.log("nws3Days: ", nws3Days);

                    // Convert timestamps in the JSON object
                    nws3Days.values.forEach(entry => {
                        entry[0] = formatNWSDate(entry[0]); // Update timestamp
                    });

                    // console.log("nws3DaysFormatted = ", nws3Days);

                    // Extract values with time ending in "13:00"
                    const valuesWithTimeNoon = extractValuesWithTimeNoon(nws3Days.values);

                    // Output the extracted values
                    // console.log("valuesWithTimeNoon = ", valuesWithTimeNoon);

                    // Extract the first second middle value
                    const firstFirstValue = valuesWithTimeNoon?.[1]?.[0];
                    const firstMiddleValue = (valuesWithTimeNoon?.[1]?.[1] !== null) ? (((parseFloat(valuesWithTimeNoon?.[1]?.[1])).toFixed(1) < 10) & ((parseFloat(valuesWithTimeNoon?.[1]?.[1])).toFixed(1) >= 0) ? (parseFloat(valuesWithTimeNoon?.[1]?.[1])).toFixed(1) : (parseFloat(valuesWithTimeNoon?.[1]?.[1])).toFixed(1)) : "";
                    // console.log("firstMiddleValue = ", firstMiddleValue);
                    // console.log("firstMiddleValue = ", typeof (firstMiddleValue));

                    // Extract the second second middle value
                    const secondFirstValue = valuesWithTimeNoon?.[2]?.[0];
                    const secondMiddleValue = (valuesWithTimeNoon?.[2]?.[1] !== null) ? (((parseFloat(valuesWithTimeNoon?.[2]?.[1])).toFixed(1) < 10) & ((parseFloat(valuesWithTimeNoon?.[2]?.[1])).toFixed(1) >= 0) ? (parseFloat(valuesWithTimeNoon?.[2]?.[1])).toFixed(1) : (parseFloat(valuesWithTimeNoon?.[2]?.[1])).toFixed(1)) : "";

                    // Extract the third second middle value
                    const thirdFirstValue = valuesWithTimeNoon?.[3]?.[0];
                    const thirdMiddleValue = (valuesWithTimeNoon?.[3]?.[1] !== null) ? (((parseFloat(valuesWithTimeNoon?.[3]?.[1])).toFixed(1) < 10) & ((parseFloat(valuesWithTimeNoon?.[3]?.[1])).toFixed(1) >= 0) ? (parseFloat(valuesWithTimeNoon?.[3]?.[1])).toFixed(1) : (parseFloat(valuesWithTimeNoon?.[3]?.[1])).toFixed(1)) : "";

                    // FLOOD CLASS
                    var floodClassDay1 = determineStageClass(firstMiddleValue, flood_level);
                    // // console.log("floodClassDay1:", floodClassDay1);

                    var floodClassDay2 = determineStageClass(secondMiddleValue, flood_level);
                    // // console.log("floodClassDay2:", floodClassDay2);

                    var floodClassDay3 = determineStageClass(thirdMiddleValue, flood_level);
                    // // console.log("floodClassDay3:", floodClassDay3);


                    if (nws3Days !== null) {
                        if (firstMiddleValue !== "-M-" && secondMiddleValue !== "-M-" && thirdMiddleValue !== "-M-") {
                            innerHTMLStage = "<table id='nws'>"
                                + "<tr>"
                                + "<td colspan='3' class='day_nws_forecast'>"
                                + "3 Day NWS Forecast"
                                + "</td>"
                                + "</tr>"
                                + "<tr>"
                                + "<td class='" + floodClassDay1 + "'>"
                                + "<a href='../chart?office=" + office + "&cwms_ts_id=" + nws3Days.name + "&lookback=6&lookforward=4&cda=internal' target='_blank' title='" + nws3Days.name + " " + firstFirstValue + "'>"
                                + firstMiddleValue
                                + "</a>"
                                + "</td>"
                                + "<td class='" + floodClassDay2 + "'>"
                                + "<a href='../chart?office=" + office + "&cwms_ts_id=" + nws3Days.name + "&lookback=6&lookforward=4&cda=internal' target='_blank' title='" + nws3Days.name + " " + secondFirstValue + "'>"
                                + secondMiddleValue
                                + "</a>"
                                + "</td>"
                                + "<td class='" + floodClassDay3 + "'>"
                                + "<a href='../chart?office=" + office + "&cwms_ts_id=" + nws3Days.name + "&lookback=6&lookforward=4&cda=internal' target='_blank' title='" + nws3Days.name + " " + thirdFirstValue + "'>"
                                + thirdMiddleValue
                                + "</a>"
                                + "</td>"
                                + "</tr>"
                                // + "<tr>"
                                // + "<td colspan='3' id='stageCell' class='day_nws_ded'></td>" // Placeholder for forecast time
                                // + "</tr>"
                                + "<table>";
                        } else {
                            innerHTMLStage = "";
                        }
                    } else {
                        innerHTMLStage = "<span class='missing'>"
                            + "-M-"
                            + "</span>"
                            + "<span class='day_nws_forecast'>"
                            + "NWS 3 Days Forecast"
                            + "</span>";
                    }
                    return stageCell.innerHTML += innerHTMLStage;
                })
                .catch(error => {
                    // Catch and log any errors that occur during fetching or processing
                    console.error("Error fetching or processing data:", error);
                });
        } else {
            // console.log("The last two characters are '29'");
        }
    }
}

function fetchAndUpdateNWSForecastDate(stageCell, tsid_stage_nws_3_day_forecast) {
    fetchAndLogNwsData(stageCell, tsid_stage_nws_3_day_forecast); // Fetch and update the data
}

function fetchAndUpdateFlow(flowCell, tsidFlow, label, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, setBaseUrl) {
    if (tsidFlow !== null) {
        const urlFlow = `${setBaseUrl}timeseries?name=${tsidFlow}&begin=${currentDateTimeMinus30Hours.toISOString()}&end=${currentDateTime.toISOString()}&office=${office}`;

        // console.log("urlFlow = ", urlFlow);
        // Fetch the time series data from the API using the determined query string
        fetch(urlFlow, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;version=2'
            }
        })
            .then(response => {
                // Check if the response is ok
                if (!response.ok) {
                    // If not, throw an error
                    throw new Error('Network response was not ok');
                }
                // If response is ok, parse it as JSON
                return response.json();
            })
            .then(flow => {
                // Once data is fetched, log the fetched data structure
                // console.log("flow: ", flow);

                // Convert timestamps in the JSON object
                flow.values.forEach(entry => {
                    entry[0] = formatNWSDate(entry[0]); // Update timestamp
                });

                // Output the updated JSON object
                // // console.log(JSON.stringify(flow, null, 2));

                // console.log("flowFormatted = ", flow);

                // FLOW CLASS
                if (label === "COE") {
                    var myFlowLabelClass = "flow_coe";
                } else if (label === "USGS") {
                    var myFlowLabelClass = "flow_usgs";
                } else if (label === "NWS") {
                    var myFlowLabelClass = "flow_nws";
                } else if (label === "MVR") {
                    var myFlowLabelClass = "flow_coe_mvr";
                } else if (label === "USGSRAW") {
                    var myFlowLabelClass = "flow_usgsraw";
                } else if (label === "SLOPEADJ") {
                    var myFlowLabelClass = "flow_slopeadj";
                } else {
                    var myFlowLabelClass = "flow";
                }
                // console.log("myFlowLabelClass = ", myFlowLabelClass);

                // Get the last non-null value from the stage data
                const lastNonNullFlowValue = getLastNonNullValue(flow);
                // Check if a non-null value was found
                if (lastNonNullFlowValue !== null) {
                    // Extract timestamp, value, and quality code from the last non-null value
                    var timestampFlowLast = lastNonNullFlowValue.timestamp;
                    var valueFlowLast = parseFloat(lastNonNullFlowValue.value).toFixed(0);
                    var qualityCodeFlowLast = lastNonNullFlowValue.qualityCode;

                    // Log the extracted valueLasts
                    // console.log("timestampFlowLast:", timestampFlowLast);
                    // console.log("valueFlowLast:", valueFlowLast);
                    // console.log("qualityCodeFlowLast:", qualityCodeFlowLast);
                } else {
                    // If no non-null valueLast is found, log a message
                    // console.log("No non-null valueLast found.");
                }

                const c_count = calculateCCount(tsidFlow);

                const lastNonNull24HoursFlowValue = getLastNonNull24HoursValue(flow, c_count);
                // console.log("lastNonNull24HoursFlowValue:", lastNonNull24HoursFlowValue);

                // Check if a non-null value was found
                if (lastNonNull24HoursFlowValue !== null) {
                    // Extract timestamp, value, and quality code from the last non-null value
                    var timestampFlow24HoursLast = lastNonNull24HoursFlowValue.timestamp;
                    var valueFlow24HoursLast = parseFloat(lastNonNull24HoursFlowValue.value).toFixed(0);
                    var qualityCodeFlow24HoursLast = lastNonNull24HoursFlowValue.qualityCode;

                    // Log the extracted valueLasts
                    // console.log("timestampFlow24HoursLast:", timestampFlow24HoursLast);
                    // console.log("valueFlow24HoursLast:", valueFlow24HoursLast);
                    // console.log("qualityCodeFlow24HoursLast:", qualityCodeFlow24HoursLast);
                } else {
                    // If no non-null valueLast is found, log a message
                    // console.log("No non-null valueLast found.");
                }

                // Calculate the 24 hours change between first and last value
                const delta24Flow = (valueFlowLast - valueFlow24HoursLast).toFixed(0);
                // console.log("delta24Flow:", delta24Flow);


                // Check if the value is greater than or equal to 1000
                if (parseFloat(delta24Flow) >= 1000 || delta24Flow <= -1000) {
                    // If greater than or equal to 1000, round to the nearest tenth and add commas at thousands place
                    roundedDelta24Flow = (Math.round(parseFloat(delta24Flow) / 10) * 10).toLocaleString();
                } else {
                    // If less than 1000, simply add commas at thousands place
                    roundedDelta24Flow = (parseFloat(delta24Flow)).toLocaleString();
                }
                // console.log("roundedDelta24Flow = ", roundedDelta24Flow); // Log the rounded and formatted value to the console

                // Check if the value is greater than or equal to 1000
                if (parseFloat(valueFlowLast) >= 1000) {
                    // If greater than or equal to 1000, round to the nearest tenth and add commas at thousands place
                    roundedValueFlowLast = (Math.round(parseFloat(valueFlowLast) / 10) * 10).toLocaleString();
                } else {
                    // If less than 1000, simply add commas at thousands place
                    roundedValueFlowLast = (parseFloat(valueFlowLast)).toLocaleString();
                }
                // console.log("roundedValueFlowLast = ", roundedValueFlowLast); // Log the rounded and formatted value to the console


                // Format the last valueLast's timestampFlowLast to a string
                const formattedLastValueTimeStamp = formatTimestampToStringIOS(timestampFlowLast);
                // console.log("formattedLastValueTimeStamp = ", formattedLastValueTimeStamp);


                // Create a Date object from the timestampFlowLast
                const timeStampDateObject = new Date(timestampFlowLast);
                // console.log("timeStampDateObject = ", timeStampDateObject);


                // Subtract 24 hours (24 * 60 * 60 * 1000 milliseconds) from the timestampFlowLast date
                const timeStampDateObjectMinus24Hours = new Date(timestampFlowLast - (24 * 60 * 60 * 1000));
                // console.log("timeStampDateObjectMinus24Hours = ", timeStampDateObjectMinus24Hours);


                // DATATIME CLASS
                var dateTimeClass = determineDateTimeClass(timeStampDateObject, currentDateTimeMinus2Hours);
                // console.log("dateTimeClass:", dateTimeClass);


                if (lastNonNullFlowValue === null) {
                    innerHTMLFlow = "<span class='missing'>"
                        + "-M-"
                        + "</span>"
                        + "<span class='temp_water'>"
                        + "label"
                        + "</span>";
                } else {
                    innerHTMLFlow = "<span class='last_max_value' title='" + flow.name + ", Value = " + roundedValueFlowLast + ", Date Time = " + timestampFlowLast + "'>"
                        + "<a href='../chart?office=" + office + "&cwms_ts_id=" + flow.name + "&lookback=4&cda=internal' target='_blank'>"
                        + roundedValueFlowLast
                        + "</a>"
                        + "</span>"
                        + " "
                        + flow.units
                        + " (" + "<span title='" + flow.name + ", Value = " + roundedValueFlowLast + ", Date Time = " + timestampFlow24HoursLast + ", Delta = (" + valueFlowLast + " - " + valueFlow24HoursLast + ") = " + roundedDelta24Flow + "'>" + roundedDelta24Flow + "</span>" + ")"
                        + "<br>"
                        + "<span class='" + dateTimeClass + "'>"
                        + formattedLastValueTimeStamp
                        + "</span>"
                        + "<span class='" + myFlowLabelClass + "'>"
                        + label
                        + "</span>";
                }
                return flowCell.innerHTML += innerHTMLFlow;
            })
            .catch(error => {
                // Catch and log any errors that occur during fetching or processing
                console.error("Error fetching or processing data:", error);
            });
    }
}

function fetchAndUpdatePrecip(precipCell, tsid, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, setBaseUrl) {
    if (tsid !== null) {
        // Fetch the time series data from the API using the determined query string
        const urlPrecip = `${setBaseUrl}timeseries?name=${tsid}&begin=${currentDateTimeMinus30Hours.toISOString()}&end=${currentDateTime.toISOString()}&office=${office}`;
        // console.log("urlPrecip = ", urlPrecip);

        fetch(urlPrecip, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;version=2'
            }
        })
            .then(response => {
                // Check if the response is ok
                if (!response.ok) {
                    // If not, throw an error
                    throw new Error('Network response was not ok');
                }
                // If response is ok, parse it as JSON
                return response.json();
            })
            .then(precip => {
                // Once data is fetched, log the fetched data structure
                // console.log("precip: ", precip);

                // Convert timestamps in the JSON object
                precip.values.forEach(entry => {
                    entry[0] = formatNWSDate(entry[0]); // Update timestamp
                });

                // Output the updated JSON object
                // // console.log(JSON.stringify(precip, null, 2));

                // console.log("precipFormatted = ", precip);


                // Get the last non-null value from the stage data
                const lastNonNullPrecipValue = getLastNonNullValue(precip);
                // console.log("lastNonNullPrecipValue:", lastNonNullPrecipValue);

                // Check if a non-null value was found
                if (lastNonNullPrecipValue !== null) {
                    // Extract timestamp, value, and quality code from the last non-null value
                    var timestampPrecipLast = lastNonNullPrecipValue.timestamp;
                    var valuePrecipLast = parseFloat(lastNonNullPrecipValue.value).toFixed(2);
                    var qualityCodePrecipLast = lastNonNullPrecipValue.qualityCode;

                    // Log the extracted valueLasts
                    // console.log("timestampPrecipLast:", timestampPrecipLast);
                    // console.log("valuePrecipLast:", valuePrecipLast);
                    // console.log("qualityCodePrecipLast:", qualityCodePrecipLast);
                } else {
                    // If no non-null valueLast is found, log a message
                    // console.log("No non-null valueLast found.");
                }


                const c_count = calculateCCount(tsid);


                const lastNonNull6HoursPrecipValue = getLastNonNull6HoursValue(precip, c_count);
                // console.log("lastNonNull6HoursPrecipValue:", lastNonNull6HoursPrecipValue);


                // Check if a non-null value was found
                if (lastNonNull6HoursPrecipValue !== null) {
                    // Extract timestamp, value, and quality code from the last non-null value
                    var timestampPrecip6HoursLast = lastNonNull6HoursPrecipValue.timestamp;
                    var valuePrecip6HoursLast = parseFloat(lastNonNull6HoursPrecipValue.value).toFixed(2);
                    var qualityCodePrecip6HoursLast = lastNonNull6HoursPrecipValue.qualityCode;

                    // Log the extracted valueLasts
                    // console.log("timestampPrecip6HoursLast:", timestampPrecip6HoursLast);
                    // console.log("valuePrecip6HoursLast:", valuePrecip6HoursLast);
                    // console.log("qualityCodePrecip6HoursLast:", qualityCodePrecip6HoursLast);
                } else {
                    // If no non-null valueLast is found, log a message
                    // console.log("No non-null valueLast found.");
                }


                const lastNonNull24HoursPrecipValue = getLastNonNull24HoursValue(precip, c_count);
                // console.log("lastNonNull24HoursPrecipValue:", lastNonNull24HoursPrecipValue);


                // Check if a non-null value was found
                if (lastNonNull24HoursPrecipValue !== null) {
                    // Extract timestamp, value, and quality code from the last non-null value
                    var timestampPrecip24HoursLast = lastNonNull24HoursPrecipValue.timestamp;
                    var valuePrecip24HoursLast = parseFloat(lastNonNull24HoursPrecipValue.value).toFixed(2);
                    var qualityCodePrecip24HoursLast = lastNonNull24HoursPrecipValue.qualityCode;

                    // Log the extracted valueLasts
                    // console.log("timestampPrecip24HoursLast:", timestampPrecip24HoursLast);
                    // console.log("valuePrecip24HoursLast:", valuePrecip24HoursLast);
                    // console.log("qualityCodePrecip24HoursLast:", qualityCodePrecip24HoursLast);
                } else {
                    // If no non-null valueLast is found, log a message
                    // console.log("No non-null valueLast found.");
                }


                // Calculate the 24 hours change between first and last value
                const precip_delta_6 = (valuePrecipLast - valuePrecip6HoursLast).toFixed(2);
                // console.log("precip_delta_6:", precip_delta_6);


                // Calculate the 24 hours change between first and last value
                const precip_delta_24 = (valuePrecipLast - valuePrecip24HoursLast).toFixed(2);
                // console.log("precip_delta_24:", precip_delta_24);


                // Format the last valueLast's timestampFlowLast to a string
                const formattedLastValueTimeStamp = formatTimestampToStringIOS(timestampPrecipLast);
                // console.log("formattedLastValueTimeStamp = ", formattedLastValueTimeStamp);

                // Create a Date object from the timestampFlowLast
                const timeStampDateObject = new Date(timestampPrecipLast);
                // console.log("timeStampDateObject = ", timeStampDateObject);

                // Subtract 24 hours (24 * 60 * 60 * 1000 milliseconds) from the timestampFlowLast date
                const timeStampDateObjectMinus24Hours = new Date(timestampPrecipLast - (24 * 60 * 60 * 1000));
                // console.log("timeStampDateObjectMinus24Hours = ", timeStampDateObjectMinus24Hours);

                // SET THE CLASS FOR PRECIP TO DISPLAY THE BACKGROUND COLOR
                if (precip_delta_6 < 0) {
                    // console.log("precip_delta_6 less than 0");
                    var myClass6 = "precip_less_0";
                    // console.log("myClass6 = ", tsid + " = " + myClass6);
                } else if (precip_delta_6 === 0) {
                    // console.log("precip_delta_6 equal to 0");
                    var myClass6 = "precip_equal_0";
                    // console.log("myClass6 = ", tsid + " = " + myClass6);
                } else if (precip_delta_6 > 0.00 && precip_delta_6 <= 0.25) {
                    // console.log("precip_delta_6 greater than 0 and less than or equal to 0.25");
                    var myClass6 = "precip_greater_0";
                    // console.log("myClass6 = ", tsid + " = " + myClass6);
                } else if (precip_delta_6 > 0.25 && precip_delta_6 <= 0.50) {
                    // console.log("precip_delta_6 greater than 0.25 and less than or equal to 0.50");
                    var myClass6 = "precip_greater_25";
                    // console.log("myClass6 = ", tsid + " = " + myClass6);
                } else if (precip_delta_6 > 0.50 && precip_delta_6 <= 1.00) {
                    // console.log("precip_delta_6 greater than 0.50 and less than or equal to 1.00");
                    var myClass6 = "precip_greater_50";
                    // console.log("myClass6 = ", tsid + " = " + myClass6);
                } else if (precip_delta_6 > 1.00 && precip_delta_6 <= 2.00) {
                    // console.log("precip_delta_6 greater than 1.00 and less than or equal to 2.00");
                    var myClass6 = "precip_greater_100";
                    // console.log("myClass6 = ", tsid + " = " + myClass6);
                } else if (precip_delta_6 > 2.00) {
                    // console.log("precip_delta_6 greater than 2.00");
                    var myClass6 = "precip_greater_200";
                    // console.log("myClass6 = ", tsid + " = " + myClass6);
                } else if (precip_delta_6 === null) {
                    // console.log("precip_delta_6 missing");
                    var myClass6 = "precip_missing";
                    // console.log("myClass6 = ", tsid + " = " + myClass6);
                } else {
                    // console.log("precip_delta_6 equal to else");
                    var myClass6 = "blank";
                    // console.log("myClass6 = ", tsid + " = " + myClass6);
                }

                if (precip_delta_24 < 0) {
                    // console.log("precip_delta_24 less than 0");
                    var myClass24 = "precip_less_0";
                    // console.log("myClass24 =", tsid + " = " + myClass24);
                } else if (precip_delta_24 === 0) {
                    // console.log("precip_delta_24 equal to 0");
                    var myClass24 = "precip_equal_0";
                    // console.log("myClass24 =", tsid + " = " + myClass24);
                } else if (precip_delta_24 > 0.00 && precip_delta_24 <= 0.25) {
                    // console.log("precip_delta_24 greater than 0 and less than or equal to 0.25");
                    var myClass24 = "precip_greater_0";
                    // console.log("myClass24 =", tsid + " = " + myClass24);
                } else if (precip_delta_24 > 0.25 && precip_delta_24 <= 0.50) {
                    // console.log("precip_delta_24 greater than 0.25 and less than or equal to 0.50");
                    var myClass24 = "precip_greater_25";
                    // console.log("myClass24 =", tsid + " = " + myClass24);
                } else if (precip_delta_24 > 0.50 && precip_delta_24 <= 1.00) {
                    // console.log("precip_delta_24 greater than 0.50 and less than or equal to 1.00");
                    var myClass24 = "precip_greater_50";
                    // console.log("myClass24 =", tsid + " = " + myClass24);
                } else if (precip_delta_24 > 1.00 && precip_delta_24 <= 2.00) {
                    // console.log("precip_delta_24 greater than 1.00 and less than or equal to 2.00");
                    var myClass24 = "precip_greater_100";
                    // console.log("myClass24 =", tsid + " = " + myClass24);
                } else if (precip_delta_24 > 2.00) {
                    // console.log("precip_delta_24 greater than 2.00");
                    var myClass24 = "precip_greater_200";
                    // console.log("myClass24 =", tsid + " = " + myClass24);
                } else if (precip_delta_24 === null) {
                    // console.log("precip_delta_24 missing");
                    var myClass24 = "precip_missing";
                    // console.log("myClass24 =", tsid + " = " + myClass24);
                } else {
                    // console.log("precip_delta_24 equal to else");
                    var myClass24 = "blank";
                    // console.log("myClass24 =", tsid + " = " + myClass24);
                }

                // DATATIME CLASS
                var dateTimeClass = determineDateTimeClass(timeStampDateObject, currentDateTimeMinus2Hours);
                // console.log("dateTimeClass:", dateTimeClass);

                if (lastNonNullPrecipValue === null) {
                    innerHTMLPrecip = "<table id='precip'>"
                        + "<tr>"
                        + "<td class='precip_missing' title='6 hr delta'>"
                        + "-M-"
                        + "</td>"
                        + "<td class='precip_missing' title='24 hr delta'>"
                        + "-M-"
                        + "</td>"
                        + "</tr>"
                        + "</table>";
                } else {
                    innerHTMLPrecip = "<table id='precip'>"
                        + "<tr>"
                        + "<td class='" + myClass6 + "' title='6 hr delta'>"
                        + "<span title='" + precip.name + ", Value = " + valuePrecip6HoursLast + ", Date Time = " + timestampPrecip6HoursLast + ", Delta = (" + valuePrecipLast + " - " + valuePrecip6HoursLast + ") = " + precip_delta_6 + "'>" + precip_delta_6 + "</span>"
                        + "</td>"
                        + "<td class='" + myClass24 + "' title='24 hr delta'>"
                        + "<span title='" + precip.name + ", Value = " + valuePrecip24HoursLast + ", Date Time = " + timestampPrecip24HoursLast + ", Delta = (" + valuePrecipLast + " - " + valuePrecip24HoursLast + ") = " + precip_delta_24 + "'>" + precip_delta_24 + "</span>"
                        + "</td>"
                        + "</tr>"
                        + "</table>"
                        + "<span class='last_max_value' title='" + precip.name + ", Value = " + valuePrecipLast + ", Date Time = " + timestampPrecipLast + "'>"
                        + "<a href='../chart?office=" + office + "&cwms_ts_id=" + precip.name + "&lookback=4&cda=internal' target='_blank'>"
                        + valuePrecipLast
                        + "</a>"
                        + "</span>"
                        + " "
                        + precip.units
                        + "<span class='" + dateTimeClass + "'>"
                        + formattedLastValueTimeStamp
                        + "</span>";
                }
                return precipCell.innerHTML += innerHTMLPrecip;
            })
            .catch(error => {
                // Catch and log any errors that occur during fetching or processing
                console.error("Error fetching or processing data:", error);
            });
    } else {
        return precipCell.innerHTML = "";
    }
}

function fetchAndUpdateWaterQuality(waterQualityCell, tsid, label, currentDateTimeMinus2Hours, currentDateTime, currentDateTimeMinus30Hours, currentDateTimeMinus8Hours, setBaseUrl) {
    if (tsid !== null) {
        // Fetch the time series data from the API using the determined query string
        const urlWaterQuality = `${setBaseUrl}timeseries?name=${tsid}&begin=${currentDateTimeMinus30Hours.toISOString()}&end=${currentDateTime.toISOString()}&office=${office}`;
        // console.log("urlWaterQuality = ", urlWaterQuality);

        fetch(urlWaterQuality, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;version=2'
            }
        })
            .then(response => {
                // Check if the response is ok
                if (!response.ok) {
                    // If not, throw an error
                    throw new Error('Network response was not ok');
                }
                // If response is ok, parse it as JSON
                return response.json();
            })
            .then(waterQuality => {
                // Once data is fetched, log the fetched data structure
                // console.log("waterQuality:", waterQuality);

                // Convert timestamps in the JSON object
                waterQuality.values.forEach(entry => {
                    entry[0] = formatNWSDate(entry[0]); // Update timestamp
                });

                // Output the updated JSON object
                // // console.log(JSON.stringify(waterQuality, null, 2));

                // console.log("lastNonNullWaterQualityValue = ", waterQuality);

                // console.log("tsid = ", tsid);
                // console.log("label = ", label);

                // WATER QUALITY CLASS
                if (label.includes("AIR")) {
                    var myWaterQualityClass = "water_quality_temp_air";
                } else if (label.includes("WATER")) {
                    var myWaterQualityClass = "water_quality_temp_water";
                } else if (label.includes("DO")) {
                    var myWaterQualityClass = "water_quality_do";
                } else if (label.includes("DEPTH")) {
                    var myWaterQualityClass = "water_quality_depth";
                } else if (label.includes("COND")) {
                    var myWaterQualityClass = "water_quality_cond";
                } else if (label.includes("PH")) {
                    var myWaterQualityClass = "water_quality_ph";
                } else if (label.includes("TURB")) {
                    var myWaterQualityClass = "water_quality_turb";
                } else if (label.includes("SPEED")) {
                    var myWaterQualityClass = "water_quality_speed_wind";
                } else if (label.includes("PRESSURE")) {
                    var myWaterQualityClass = "water_quality_pressure";
                } else if (label.includes("DIR")) {
                    var myWaterQualityClass = "water_quality_dir_wind";
                } else if (label.includes("NITRATE")) {
                    var myWaterQualityClass = "water_quality_dir_wind";
                } else if (label.includes("CHLOROPHYLL")) {
                    var myWaterQualityClass = "water_quality_dir_wind";
                } else if (label.includes("PHYCOCYANIN")) {
                    var myWaterQualityClass = "water_quality_dir_wind";
                } else if (label === undefined) {
                    var myWaterQualityClass = "water_quality_do";
                } else {
                    var myWaterQualityClass = "";
                }
                // console.log("myWaterQualityClass = ", myWaterQualityClass);


                // Get the last non-null value from the stage data
                const lastNonNullWaterQualityValue = getLastNonNullValue(waterQuality);
                // console.log("lastNonNullWaterQualityValue = ", lastNonNullWaterQualityValue);
                // console.log("lastNonNullWaterQualityValue = ", typeof(lastNonNullWaterQualityValue));

                // Check if a non-null value was found
                if (lastNonNullWaterQualityValue !== null) {
                    // Extract timestamp, value, and quality code from the last non-null value
                    var timestampWaterQualityLast = lastNonNullWaterQualityValue.timestamp;
                    var valueWaterQualityLast = parseFloat(lastNonNullWaterQualityValue.value).toFixed(0);
                    var qualityCodeWaterQualityLast = lastNonNullWaterQualityValue.qualityCode;

                    // Log the extracted valueLasts
                    // console.log("timestampWaterQualityLast:", timestampWaterQualityLast);
                    // console.log("valueWaterQualityLast:", valueWaterQualityLast);
                    // console.log("qualityCodeWaterQualityLast:", qualityCodeWaterQualityLast);
                } else {
                    // If no non-null valueLast is found, log a message
                    // console.log("No non-null valueLast found.");
                }


                const c_count = calculateCCount(tsid);


                const lastNonNull24HoursWaterQualityValue = getLastNonNull24HoursValue(waterQuality, c_count);
                // console.log("lastNonNull24HoursWaterQualityValue:", lastNonNull24HoursWaterQualityValue);


                // Check if a non-null value was found
                if (lastNonNull24HoursWaterQualityValue !== null) {
                    // Extract timestamp, value, and quality code from the last non-null value
                    var timestampWaterQuality24HoursLast = lastNonNull24HoursWaterQualityValue.timestamp;
                    var valueWaterQuality24HoursLast = parseFloat(lastNonNull24HoursWaterQualityValue.value).toFixed(0);
                    var qualityCodeWaterQuality24HoursLast = lastNonNull24HoursWaterQualityValue.qualityCode;

                    // Log the extracted valueLasts
                    // console.log("timestampWaterQuality24HoursLast:", timestampWaterQuality24HoursLast);
                    // console.log("valueWaterQuality24HoursLast:", valueWaterQuality24HoursLast);
                    // console.log("qualityCodeWaterQuality24HoursLast:", qualityCodeWaterQuality24HoursLast);
                } else {
                    // If no non-null valueLast is found, log a message
                    // console.log("No non-null valueLast found.");
                }

                // Calculate the 24 hours change between first and last value
                const delta_24_water_quality = (valueWaterQualityLast - valueWaterQuality24HoursLast).toFixed(0);
                // console.log("delta_24_water_quality:", delta_24_water_quality);

                // Format the last valueLast's timestampFlowLast to a string
                const formattedLastValueTimeStamp = formatTimestampToStringIOS(timestampWaterQualityLast);
                // console.log("formattedLastValueTimeStamp = ", formattedLastValueTimeStamp);

                // Create a Date object from the timestampFlowLast
                const timeStampDateObject = new Date(timestampWaterQualityLast);
                // console.log("timeStampDateObject = ", timeStampDateObject);

                // Subtract 24 hours (24 * 60 * 60 * 1000 milliseconds) from the timestampFlowLast date
                const timeStampDateObjectMinus24Hours = new Date(timestampWaterQualityLast - (24 * 60 * 60 * 1000));
                // console.log("timeStampDateObjectMinus24Hours = ", timeStampDateObjectMinus24Hours);

                // DATATIME CLASS
                var dateTimeClass = determineDateTimeClassWaterQuality(timeStampDateObject, currentDateTimeMinus2Hours, currentDateTimeMinus8Hours, label);
                // console.log("dateTimeClass:", dateTimeClass);

                if (lastNonNullWaterQualityValue === null) {
                    innerHTMLWaterQuality = "<span class='missing' title='" + waterQuality.name + "'>"
                        + "-M-"
                        + "</span>"
                        + "<span class='" + myWaterQualityClass + "'>"
                        + label
                        + "</span>";
                } else if (valueWaterQualityLast > 1000) {
                    innerHTMLWaterQuality = "<span class='blinking-text' title='" + waterQuality.name + ", Value = " + valueWaterQualityLast + ", Date Time = " + timestampWaterQualityLast + "'>"
                        + "<a href='../chart?office=" + office + "&cwms_ts_id=" + waterQuality.name + "&lookback=4&cda=internal' target='_blank'>"
                        + valueWaterQualityLast
                        + "</a>"
                        + "</span>"
                        + " "
                        + waterQuality.units
                        + " (" + "<span title='" + waterQuality.name + ", Value = " + valueWaterQuality24HoursLast + ", Date Time = " + timestampWaterQuality24HoursLast + ", Delta = (" + valueWaterQualityLast + " - " + valueWaterQuality24HoursLast + ") = " + delta_24_water_quality + "'>" + delta_24_water_quality + "</span>" + ")"
                        + "<br>"
                        + "<span class='" + dateTimeClass + "'>"
                        + formattedLastValueTimeStamp
                        + "</span>"
                        + "<span class='" + myWaterQualityClass + "'>"
                        + label
                        + "</span>";
                } else {
                    innerHTMLWaterQuality = "<span class='last_max_value' title='" + waterQuality.name + ", Value = " + valueWaterQualityLast + ", Date Time = " + timestampWaterQualityLast + "'>"
                        + "<a href='../chart?office=" + office + "&cwms_ts_id=" + waterQuality.name + "&lookback=4&cda=internal' target='_blank'>"
                        + valueWaterQualityLast
                        + "</a>"
                        + "</span>"
                        + " "
                        + waterQuality.units
                        + " (" + "<span title='" + waterQuality.name + ", Value = " + valueWaterQuality24HoursLast + ", Date Time = " + timestampWaterQuality24HoursLast + ", Delta = (" + valueWaterQualityLast + " - " + valueWaterQuality24HoursLast + ") = " + delta_24_water_quality + "'>" + delta_24_water_quality + "</span>" + ")"
                        + "<br>"
                        + "<span class='" + dateTimeClass + "'>"
                        + formattedLastValueTimeStamp
                        + "</span>"
                        + "<span class='" + myWaterQualityClass + "'>"
                        + label
                        + "</span>";
                }
                return waterQualityCell.innerHTML += innerHTMLWaterQuality;
            })
            .catch(error => {
                // Catch and log any errors that occur during fetching or processing
                console.error("Error fetching or processing data:", error);
            });
    }
}

/******************************************************************************
 *                           GET DATA FUNCTIONS                               *
 ******************************************************************************/
function getLastNonNullValue(data) {
    // Iterate over the values array in reverse
    for (let i = data.values.length - 1; i >= 0; i--) {
        // Check if the value at index i is not null
        if (data.values[i][1] !== null) {
            // Return the non-null value as separate variables
            return {
                timestamp: data.values[i][0],
                value: data.values[i][1],
                qualityCode: data.values[i][2]
            };
        }
    }
    // If no non-null value is found, return null
    return null;
}

function getLastNonNull24HoursValue(data, c_count) {
    let nonNullCount = 0;
    for (let i = data.values.length - 1; i >= 0; i--) {
        if (data.values[i][1] !== null) {
            nonNullCount++;
            if (nonNullCount > c_count) {
                return {
                    timestamp: data.values[i][0],
                    value: data.values[i][1],
                    qualityCode: data.values[i][2]
                };
            }
        }
    }
    return null;
}

function getLastNonNull6HoursValue(data, c_count) {
    let nonNullCount = 0;
    for (let i = data.values.length - 1; i >= 0; i--) {
        if (data.values[i][1] !== null) {
            nonNullCount++;
            if (nonNullCount > (c_count / 4)) {
                return {
                    timestamp: data.values[i][0],
                    value: data.values[i][1],
                    qualityCode: data.values[i][2]
                };
            }
        }
    }
    return null;
}

function getFirstNonNullValue(data) {
    // Iterate over the values array
    for (let i = 0; i < data.values.length; i++) {
        // Check if the value at index i is not null
        if (data.values[i][1] !== null) {
            // Return the non-null value as separate variables
            return {
                timestamp: data.values[i][0],
                value: data.values[i][1],
                qualityCode: data.values[i][2]
            };
        }
    }
    // If no non-null value is found, return null
    return null;
}

/******************************************************************************
 *                            CLASSES CDA FUNCTIONS                           *
 ******************************************************************************/
function determineStageClass(stage_value, flood_value) {
    // console.log("determineStageClass = ", stage_value + typeof (stage_value) + " " + flood_value + typeof (flood_value));
    var myStageClass;
    if (parseFloat(stage_value) >= parseFloat(flood_value)) {
        // console.log("determineStageClass = ", stage_value + " >= " + flood_value);
        myStageClass = "last_max_value_flood";
    } else {
        // console.log("Stage Below Flood Level");
        myStageClass = "last_max_value";
    }
    return myStageClass;
}

function determineDateTimeClass(formattedDate, currentDateTimeMinus2Hours) {
    var myDateTimeClass;
    if (formattedDate >= currentDateTimeMinus2Hours) {
        myDateTimeClass = "date_time_current";
    } else {
        // myDateTimeClass = "date_time_late";
        myDateTimeClass = "blinking-text";
    }
    return myDateTimeClass;
}

function determineDateTimeClassWaterQuality(formattedDate, currentDateTimeMinus2Hours, currentDateTimeMinus8Hours, label) {
    let myDateTimeClass;
    if (label.includes("LPMS")) {
        if (formattedDate >= currentDateTimeMinus8Hours) {
            myDateTimeClass = "date_time_current";
            // console.log("formattedDate = ", formattedDate);
        } else {
            myDateTimeClass = "date_time_late";
            // console.log("formattedDate = ", formattedDate);
            // console.log("currentDateTimeMinus8Hours = ", currentDateTimeMinus8Hours);
        }
    } else {
        if (formattedDate >= currentDateTimeMinus2Hours) {
            myDateTimeClass = "date_time_current";
            // console.log("formattedDate = ", formattedDate);
        } else {
            myDateTimeClass = "date_time_late";
            // console.log("formattedDate = ", formattedDate);
            // console.log("currentDateTimeMinus2Hours = ", currentDateTimeMinus2Hours);
        }
    }
    // console.log("myDateTimeClass = ", myDateTimeClass);
    return myDateTimeClass;
}

/******************************************************************************
 *                            SUPPORT CDA FUNCTIONS                           *
 ******************************************************************************/
function filterByLocationCategory(array, category) {
    return array.filter(item =>
        item['location-category'] &&
        item['location-category']['office-id'] === category['office-id'] &&
        item['location-category']['id'] === category['id']
    );
}

function subtractHoursFromDate(date, hoursToSubtract) {
    return new Date(date.getTime() - (hoursToSubtract * 60 * 60 * 1000));
}

function plusHoursFromDate(date, hoursToSubtract) {
    return new Date(date.getTime() + (hoursToSubtract * 60 * 60 * 1000));
}

function addDaysToDate(date, days) {
    return new Date(date.getTime() + (days * 24 * 60 * 60 * 1000));
}

function formatTimestampToString(timestampLast) {
    const date = new Date(timestampLast);
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return formattedDate;
}

function formatNWSDate(timestamp) {
    const date = new Date(timestamp);
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Month
    const dd = String(date.getDate()).padStart(2, '0'); // Day
    const yyyy = date.getFullYear(); // Year
    const hh = String(date.getHours()).padStart(2, '0'); // Hours
    const min = String(date.getMinutes()).padStart(2, '0'); // Minutes
    return `${mm}-${dd}-${yyyy} ${hh}:${min}`;
}

function extractValuesWithTimeNoon(values) {
    return values.filter(entry => {
        const timestamp = new Date(entry[0]);
        const hours = timestamp.getHours();
        const minutes = timestamp.getMinutes();
        return (hours === 7 || hours === 6) && minutes === 0; // Check if time is 13:00
    });
}

function calculateCCount(tsid) {
    // Split the string at the period
    const splitString = tsid.split('.');

    // Access the fifth element
    const forthElement = splitString[3];
    // console.log("forthElement = ", forthElement);

    // Initialize c_count variable
    let c_count;

    // Set c_count based on the value of firstTwoCharacters
    switch (forthElement) {
        case "15Minutes":
            c_count = 96;
            break;
        case "10Minutes":
            c_count = 144;
            break;
        case "30Minutes":
            c_count = 48;
            break;
        case "1Hour":
            c_count = 24;
            break;
        case "6Hours":
            c_count = 4;
            break;
        case "~2Hours":
            c_count = 12;
            break;
        case "5Minutes":
            c_count = 288;
            break;
        case "~1Day":
            c_count = 1;
            break;
        default:
            // Default value if forthElement doesn't match any case
            c_count = 0;
    }

    return c_count;
}

function generateDateTimeMidNightStringsISO(currentDateTime, currentDateTimePlus4Days) {
    // Convert current date and time to ISO string
    const currentDateTimeISO = currentDateTime.toISOString();
    // Extract the first 10 characters from the ISO string
    const first10CharactersDateTimeISO = currentDateTimeISO.substring(0, 10);

    // Get midnight in the Central Time zone
    const midnightCentral = new Date(currentDateTime.toLocaleDateString('en-US', { timeZone: 'America/Chicago' }));
    midnightCentral.setHours(0, 0, 0, 0); // Set time to midnight

    // Convert midnight to ISO string
    const midnightCentralISO = midnightCentral.toISOString();

    // Append midnight central time to the first 10 characters of currentDateTimeISO
    const currentDateTimeMidNightISO = first10CharactersDateTimeISO + midnightCentralISO.substring(10);

    // Convert currentDateTimePlus4Days to ISO string
    const currentDateTimePlus4DaysISO = currentDateTimePlus4Days.toISOString();
    // Extract the first 10 characters from the ISO string of currentDateTimePlus4Days
    const first10CharactersDateTimePlus4DaysISO = currentDateTimePlus4DaysISO.substring(0, 10);

    // Append midnight central time to the first 10 characters of currentDateTimePlus4DaysISO
    const currentDateTimePlus4DaysMidNightISO = first10CharactersDateTimePlus4DaysISO + midnightCentralISO.substring(10);

    return {
        currentDateTimeMidNightISO,
        currentDateTimePlus4DaysMidNightISO
    };
}

function getStationForLocation(locationId, riverMileObject) {
    // console.log("riverMileObject BEFORE function call:", JSON.stringify(riverMileObject, null, 2));
    // console.log("Type of riverMileObject:", typeof riverMileObject);
    // console.log("Is riverMileObject an array?", Array.isArray(riverMileObject));

    if (!Array.isArray(riverMileObject)) {
        // console.error("riverMileObject is not an array or is undefined/null", riverMileObject);
        return null;
    }

    for (const entry of riverMileObject) {
        // console.log("Processing entry:", JSON.stringify(entry, null, 2)); // Log full entry

        if (!entry || !entry["stream-location-node"]) {
            // console.warn("Skipping entry due to missing stream-location-node", entry);
            continue;
        }

        const name = entry["stream-location-node"]?.id?.name;
        // console.log("Location ID in entry:", name);

        if (name === locationId) {
            // console.log("Match found! Returning station:", entry["stream-location-node"]?.["stream-node"]?.station);
            return entry["stream-location-node"]?.["stream-node"]?.station || null;
        }
    }

    // console.log("No match found for locationId:", locationId);
    return null;
}

function formatTimestampToStringIOS(timestamp) {
    if (!timestamp) return "Invalid date";

    // Split the timestamp into date and time parts
    const [datePart, timePart] = timestamp.split(" ");
    const [day, month, year] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);

    // Create a new Date object (Month is 0-based in JS)
    const dateObj = new Date(Date.UTC(year, month - 1, day, hours, minutes));

    if (isNaN(dateObj.getTime())) return "Invalid date";

    // Format as "YYYY-MM-DD HH:mm"
    return dateObj.toISOString().replace("T", " ").slice(0, 16);
}

/******************************************************************************
 *                               FUNCTIONS PHP JSON                           *
 ******************************************************************************/
async function fetchDataFromNwsForecastsOutput() {
    let urlNwsForecast = null;
    if (cda === "public") {
        urlNwsForecast = `https://www.${office.toLocaleLowerCase()}-wc.usace.army.mil/php_data_api/public/json/exportNwsForecasts2Json.json`;
    } else if (cda === "internal") {
        urlNwsForecast = `https://wm.${office.toLocaleLowerCase()}.ds.usace.army.mil/php_data_api/public/json/exportNwsForecasts2Json.json`;
    }
    // console.log("urlNwsForecast: ", urlNwsForecast);

    try {
        const response = await fetch(urlNwsForecast);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Propagate the error further if needed
    }
}

function filterDataByTsid(NwsOutput, cwms_ts_id) {
    return NwsOutput.filter(item => item !== null && item.cwms_ts_id_day1 === cwms_ts_id);
}

async function fetchAndLogNwsData(stageCell, tsid_stage_nws_3_day_forecast) {
    try {
        const NwsOutput = await fetchDataFromNwsForecastsOutput();
        // console.log('NwsOutput:', NwsOutput);

        const filteredData = filterDataByTsid(NwsOutput, tsid_stage_nws_3_day_forecast);
        // console.log("Filtered NwsOutput Data for", tsid_stage_nws_3_day_forecast + ":", filteredData);

        // Update the HTML element with filtered data
        updateNwsForecastTimeHTML(filteredData, stageCell);

        // Further processing of NWS data as needed
    } catch (error) {
        // Handle errors from fetchDataFromNwsForecastsOutput
        console.error('Failed to fetch data:', error);
    }
}

function updateNwsForecastTimeHTML(filteredData, stageCell) {
    const locationData = filteredData.find(item => item !== null); // Find the first non-null item
    if (!locationData) {
        stageCell.innerHTML = ''; // Handle case where no valid data is found
        return;
    }

    const entryDate = locationData.data_entry_date_cst1;

    // Parse the entry date string
    const dateParts = entryDate.split('-'); // Split by hyphen
    const day = dateParts[0]; // Day part
    const monthAbbreviation = dateParts[1]; // Month abbreviation (e.g., JUL)
    const year = dateParts[2].substring(0, 2); // Last two digits of the year (e.g., 24)

    // Map month abbreviation to month number
    const months = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    };

    const month = months[monthAbbreviation]; // Get numeric month

    // Parse time parts
    const timeParts = entryDate.split(' ')[1].split('.'); // Split time part by period
    const hours = timeParts[0]; // Hours part
    const minutes = timeParts[1]; // Minutes part

    // Determine period (AM/PM)
    const period = timeParts[3] === 'PM' ? 'PM' : 'AM';

    // Construct formatted date and time
    const formattedDateTime = `${month}-${day}-${year} ${hours}:${minutes} ${period}`;

    // Update the HTML content
    stageCell.innerHTML += `<span class="hard_coded_php" title="Uses PHP Json Output, No Cloud Option Yet">Forecast Date: ${formattedDateTime}<span>`;
}