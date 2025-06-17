document.addEventListener('DOMContentLoaded', async function () {
    // Display the loading_alarm_mvs indicator
    const loadingIndicator = document.getElementById('loading_json');
    loadingIndicator.style.display = 'block';

    let setBaseUrl = null;
    if (cda === "internal") {
        setBaseUrl = `https://wm.${office.toLowerCase()}.ds.usace.army.mil/${office.toLowerCase()}-data/`;
    } else if (cda === "internal-coop") {
        setBaseUrl = `https://wm-${office.toLowerCase()}coop.mvk.ds.usace.army.mil/${office.toLowerCase()}-data/`;
    } else if (cda === "public") {
        setBaseUrl = `https://cwms-data.usace.army.mil/cwms-data/`;
        // setBaseUrl = `https://cwms.sec.usace.army.mil/cwms-data/`;
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
                createTable(combinedData, setBaseUrl);
                loadingIndicator.style.display = 'none';
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    } else {
        // Store location metadata and flood data
        const metadataMap = new Map();
        const floodMap = new Map();
        const lwrpMap = new Map();
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
        // const riverMileHardCodedMap = new Map();
        const riverMileMap = new Map();

        // Arrays to track promises for metadata and flood data fetches
        const metadataPromises = [];
        const floodPromises = [];
        const lwrpPromises = [];
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
        const riverMilePromises = [];

        if (cda === "internal") {
            apiUrl = `${setBaseUrl}location/group?office=${office}&group-office-id=MVS&category-office-id=MVS&category-id=Basins`;
        } else if (cda === "public") {
            apiUrl = `${setBaseUrl}location/group?office=${office}&group-office-id=${office}&category-office-id=${office}&category-id=Basins`;
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
                    // basinApiUrl = `${setBaseUrl}location/group/${basin}?office=${office}&category-id=Basins`;
                    basinApiUrl = `${setBaseUrl}location/group/${basin}?office=MVS&group-office-id=MVS&category-office-id=MVS&category-id=Basins`; // 2025.03.04-develop
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

                                    // lwrp data request
                                    (() => {
                                        let lwrpApiUrl = `${setBaseUrl}levels/${loc['location-id']}.Stage.Inst.0.LWRP?office=${office}&effective-date=2024-01-01T08:00:00&unit=ft`;
                                        if (lwrpApiUrl) {
                                            // Push the fetch promise to the lwrpPromises array
                                            lwrpPromises.push(
                                                fetch(lwrpApiUrl)
                                                    .then(response => {
                                                        if (response.status === 404) {
                                                            // console.warn(`lwrp data not found for location: ${loc['location-id']}`);
                                                            return null; // Skip processing if no lwrp data is found
                                                        }
                                                        if (!response.ok) {
                                                            throw new Error(`Network response was not ok: ${response.statusText}`);
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(lwrpData => {
                                                        if (lwrpData) {
                                                            lwrpMap.set(loc['location-id'], lwrpData);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error(`Problem with the fetch operation for lwrp data at ${lwrpApiUrl}:`, error);
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
                                        let ownerApiUrl = `${setBaseUrl}location/group/${office}?office=${office}&category-id=${office}`;
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

                                    // river mile data request
                                    (() => {
                                        // let riverMileApiUrl = `${setBaseUrl}stream-locations?office-mask=MVS`;
                                        let riverMileApiUrl = `${setBaseUrl}stream-locations?office-mask=${office}&name-mask=${loc['location-id']}`;
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
                    .then(() => Promise.all(lwrpPromises))
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
                    // .then(() => Promise.all(riverMileHardCodedPromises))
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

                                        const lwrpMapData = lwrpMap.get(loc['location-id']);
                                        if (lwrpMapData) {
                                            loc['lwrp'] = lwrpMapData;
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
                        createTable(combinedData, setBaseUrl);
                        loadingIndicator.style.display = 'none';
                    })
                    .catch(error => {
                        console.error('There was a problem with one or more fetch operations:', error);
                    });

            })
            .catch(error => {
                console.error('There was a problem with the initial fetch operation:', error);

                console.error('There was a problem with the initial fetch operation:', error);
                loadingIndicator.style.display = 'none';
                document.getElementById(`table_container_gage_data_cda`).innerText = "Cloud database is down";

                // Show the "Report Issue" button
                document.getElementById('reportIssueBtn').style.display = "block";

                // Ensure sendEmail is globally accessible
                window.sendEmail = function () {
                    const subject = encodeURIComponent("Cloud Database Down");
                    const body = encodeURIComponent("Hello,\n\nIt appears that the cloud database is down. Please investigate the issue." + setBaseUrl);
                    const email = "DLL-CEMVS-WM-SysAdmins@usace.army.mil"; // Replace with actual support email

                    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
                };
            });
    }

    /******************************************************************************
    *                               CREATE TABLE FUNCTIONS                       *
    ******************************************************************************/

    function createTable(allData, setBaseUrl) {
        // Create a table element
        const table = document.createElement('table');
        table.setAttribute('id', 'gage_data');

        // Create a table header row 
        const headerRow = document.createElement('tr');

        // Define column headers and their respective widths
        let columns = null;
        let columnWidths = null;

        if (office === "MVS") {
            columns = ["Gage", "Stage (24hr)", "Flow (24hr)", "Precip [6hr] [24hr]", "Water Quality", "River Mile", "Flood Level", "LWRP Level"];
            columnWidths = ["14%", "14%", "14%", "14%", "14%", "10%", "10%", "10%"];
        } else {
            columns = ["Gage", "Stage (24hr)", "Flow (24hr)", "Precip [6hr] [24hr]", "Water Quality", "River Mile", "Flood Level", "LWRP Level"];
            columnWidths = ["14%", "14%", "14%", "14%", "14%", "10%", "10%", "10%"];
        }

        columns.forEach((columnName, index) => {
            const th = document.createElement('th');
            th.textContent = columnName;
            th.style.whiteSpace = 'nowrap';
            th.style.width = columnWidths[index]; // Hardcoded width %

            // Style depending on CDA
            th.style.height = '50px';
            if (cda === "public" || cda === "internal") {
                th.style.backgroundColor = 'darkblue';
                th.style.color = 'white';
            }

            headerRow.appendChild(th);
        });

        // Append the header row to the table
        table.appendChild(headerRow);

        const currentDateTime = new Date();
        // console.log('currentDateTime:', currentDateTime);

        const currentDateTimeISO = currentDateTime.toISOString();
        console.log('currentDateTimeISO:', currentDateTimeISO);

        function subtractHoursFromISO(isoString, hoursToSubtract) {
            const date = new Date(isoString);
            const newDate = new Date(date.getTime() - hoursToSubtract * 60 * 60 * 1000);
            return newDate.toISOString();
        }

        function addHoursFromISO(isoString, hoursToSubtract) {
            const date = new Date(isoString);
            const newDate = new Date(date.getTime() + hoursToSubtract * 60 * 60 * 1000);
            return newDate.toISOString();
        }

        // MINUS TIME
        const currentDateTimeISOMinus2Hours = subtractHoursFromISO(currentDateTimeISO, 2);
        console.log('currentDateTimeISOMinus2Hours :', currentDateTimeISOMinus2Hours);

        const currentDateTimeISOMinus8Hours = subtractHoursFromISO(currentDateTimeISO, 8);
        console.log('currentDateTimeISOMinus8Hours :', currentDateTimeISOMinus8Hours);

        const currentDateTimeISOMinus30Hours = subtractHoursFromISO(currentDateTimeISO, 30);
        console.log('currentDateTimeISOMinus30Hours :', currentDateTimeISOMinus30Hours);

        // ADD TIME
        const currentDateTimeISOAdd2Hours = addHoursFromISO(currentDateTimeISO, 2);
        console.log('currentDateTimeISOAdd2Hours :', currentDateTimeISOAdd2Hours);

        const currentDateTimeISOAdd30Hours = addHoursFromISO(currentDateTime, 30);
        console.log('currentDateTimeISOAdd30Hours :', currentDateTimeISOAdd30Hours);

        const currentDateTimeISOAdd96Hours = addHoursFromISO(currentDateTime, 96);
        console.log('currentDateTimeISOAdd96Hours :', currentDateTimeISOAdd96Hours);

        // Iterate through the mergedData to populate the table
        for (const locData of allData[0][`assigned-locations`]) {
            console.log("locData:", locData);

            // Only show location where "visible" is true
            if (locData.visible !== false) {
                const row = table.insertRow();

                let flood_level = "";

                const floodValue = locData?.flood?.["constant-value"];

                if (floodValue !== null && floodValue !== undefined) {
                    const value = parseFloat(floodValue);
                    if (value !== 0 && value <= 900) {
                        flood_level = value.toFixed(2);
                    }
                }

                let lwrp_level = "";

                const lwrpValue = locData?.lwrp?.["constant-value"];

                if (lwrpValue !== null && lwrpValue !== undefined) {
                    const value = parseFloat(lwrpValue);
                    if (value !== 0 && value <= 900) {
                        lwrp_level = value.toFixed(2);
                    }
                }

                // LOCATION
                (() => {
                    // Create a new table cell for displaying location data
                    const locationCell = row.insertCell();
                    locationCell.style.textAlign = 'left';
                    locationCell.style.fontWeight = 'bold';

                    const assignedLocations = locData.owner?.['assigned-locations']?.map(loc => loc['location-id']) || [];
                    const isAssigned = assignedLocations.includes(locData['location-id']);
                    const publicName = locData.metadata?.['public-name'] || '';
                    const locationId = locData['location-id'];

                    if (isAssigned) {
                        locationCell.style.color = 'darkblue';
                        locationCell.style.whiteSpace = 'nowrap';

                        if (cda === 'internal') {
                            const link = document.createElement('a');
                            link.target = '_blank';
                            link.href = `../metadata?office=MVS&type=data&gage=${encodeURIComponent(locationId)}`;
                            link.textContent = publicName;
                            locationCell.appendChild(link);
                        } else {
                            locationCell.textContent = publicName;
                        }
                    } else {
                        locationCell.textContent = publicName;
                    }
                })();

                // STAGE
                (() => {
                    // Create a new table cell for displaying stage data
                    const stageCell = row.insertCell();

                    // Create container and content divs
                    const containerDiv = document.createElement('div');
                    containerDiv.className = 'container';

                    const topDiv = document.createElement('div');
                    const middleDiv = document.createElement('div');
                    const bottomDiv = document.createElement('div');

                    topDiv.className = 'box top';
                    middleDiv.className = 'box middle';
                    bottomDiv.className = 'box bottom';

                    const isTemporarilyRemoved = locData.attribute?.toString().endsWith('.1');
                    const hasStageTS = locData['tsid-stage']?.['assigned-time-series']?.[0]?.['timeseries-id'];
                    const hasForecastNwsTS = locData['tsid-forecast-nws']?.['assigned-time-series']?.[0]?.['timeseries-id'];

                    if (isTemporarilyRemoved) {
                        topDiv.innerHTML = 'Temporally Removed';
                    } else {
                        if (hasStageTS) {
                            const tsidStage = hasStageTS;
                            fetchAndUpdateStage(
                                topDiv,
                                tsidStage,
                                flood_level,
                                currentDateTimeISOMinus2Hours,
                                currentDateTimeISO,
                                currentDateTimeISOMinus30Hours,
                                setBaseUrl
                            );

                            if (office === 'MVS' && cda === 'internal' && hasForecastNwsTS) {
                                const tsidForecastNws = hasForecastNwsTS;
                                fetchAndUpdateNWS(
                                    middleDiv,
                                    tsidStage,
                                    tsidForecastNws,
                                    flood_level,
                                    currentDateTimeISO,
                                    currentDateTimeISOAdd96Hours,
                                    setBaseUrl
                                );

                                bottomDiv.innerHTML = `<span class="data_entry_date_nws_forecast" title="Uses PHP Json Output, No Cloud Option Yet">Forecast Date: -TBD-</span>`;
                            }
                        }
                    }

                    // Append content divs to container and then to the table cell
                    containerDiv.append(topDiv, middleDiv, bottomDiv);
                    stageCell.appendChild(containerDiv);
                })();

                // FLOW
                (() => {
                    const flowCell = row.insertCell();

                    const series = locData['tsid-flow']?.['assigned-time-series'] || [];

                    if (series.length > 0) {
                        series.sort((a, b) => a.attribute - b.attribute);

                        const limit = (cda === 'public') ? 1 : series.length;

                        if (locData.attribute?.toString().endsWith('.1')) {
                            flowCell.innerHTML = "Temporally Removed";
                        } else {
                            for (let i = 0; i < limit; i++) {
                                const { 'timeseries-id': tsidFlow, 'alias-id': tsidFlowLabel } = series[i];
                                fetchAndUpdateFlow(
                                    flowCell,
                                    tsidFlow,
                                    tsidFlowLabel,
                                    currentDateTimeISOMinus2Hours,
                                    currentDateTimeISO,
                                    currentDateTimeISOMinus30Hours,
                                    setBaseUrl
                                );
                            }
                        }
                    }
                })();

                // PRECIP
                (() => {
                    const precipCell = row.insertCell();

                    const tsidPrecip = locData['tsid-precip']?.['assigned-time-series']?.[0]?.['timeseries-id'];

                    if (tsidPrecip) {
                        if (locData.attribute?.toString().endsWith('.1')) {
                            precipCell.innerHTML = "Temporally Removed";
                        } else {
                            fetchAndUpdatePrecip(
                                precipCell,
                                tsidPrecip,
                                currentDateTimeISOMinus2Hours,
                                currentDateTimeISO,
                                currentDateTimeISOMinus30Hours,
                                setBaseUrl
                            );
                        }
                    }
                })();

                // WATER QUALITY
                (() => {
                    const waterQualityCell = row.insertCell();
                    if (locData.attribute.toString().endsWith('.1')) {
                        waterQualityCell.innerHTML = "Temporally Removed";
                    } else {
                        if (locData['tsid-temp-air']) {
                            const series = locData['tsid-temp-air']['assigned-time-series'];
                            if (series.length > 0) {
                                series.sort((a, b) => a.attribute - b.attribute);

                                // Determine how many series to show
                                let limit = (cda === 'public') ? 0 : series.length;
                                if (locData.metadata['public-name'] === "Rend Pool") {
                                    limit = series.length;
                                }

                                for (let i = 0; i < limit; i++) {
                                    const { 'timeseries-id': tsidTempAir, 'alias-id': tsidTempAirLabel } = series[i];
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidTempAir, tsidTempAirLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidTempWater, tsidTempWaterLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
                                }
                            }
                        }

                        if (locData['tsid-speed-wind']) {
                            const series = locData['tsid-speed-wind']['assigned-time-series'];
                            if (series.length > 0) {
                                series.sort((a, b) => a.attribute - b.attribute);

                                // Determine how many series to show
                                let limit = (cda === 'public') ? 0 : Math.min(4, series.length);
                                if (locData.metadata['public-name'] === "Rend Pool") {
                                    limit = series.length;
                                }

                                for (let i = 0; i < limit; i++) {
                                    const { 'timeseries-id': tsidSpeedWind, 'alias-id': tsidSpeedWindLabel } = series[i];
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidSpeedWind, tsidSpeedWindLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
                                }
                            }
                        }

                        if (locData['tsid-dir-wind']) {
                            const series = locData['tsid-dir-wind']['assigned-time-series'];
                            if (series.length > 0) {
                                series.sort((a, b) => a.attribute - b.attribute);

                                // Determine how many series to show
                                let limit = (cda === 'public') ? 0 : Math.min(4, series.length);
                                if (locData.metadata['public-name'] === "Rend Pool") {
                                    limit = series.length;
                                }

                                for (let i = 0; i < limit; i++) {
                                    const { 'timeseries-id': tsidDirWind, 'alias-id': tsidDirWindLabel } = series[i];
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidDirWind, tsidDirWindLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidDo, tsidDoLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidDepth, tsidDepthLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidCond, tsidCondLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidPh, tsidPhLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidturbf, tsidturbfLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidpressure, tsidpressureLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidnitrate, tsidnitrateLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidchlorophyll, tsidchlorophyllLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidphycocyanin, tsidphycocyaninLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
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
                                    fetchAndUpdateWaterQuality(waterQualityCell, tsidspeed, tsidspeedLabel, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl);
                                }
                            }
                        }
                    }
                })();

                // GAGE-ZERO/RIVER-MILE
                (() => {
                    const riverMileCell = row.insertCell();

                    if (office === "MVS") {
                        const locationId = locData["location-id"];
                        const riverMileObject = locData["river-mile"] || locData["River-Mile"] || [];
                        const riverMileValue = getStationForLocation(locationId, riverMileObject);

                        riverMileCell.textContent = riverMileValue != null
                            ? parseFloat(riverMileValue).toFixed(1)
                            : "N/A";
                    } else {
                        const datum = locData.metadata["vertical-datum"];
                        const elevation = locData.metadata.elevation;

                        riverMileCell.innerHTML = (datum && elevation !== undefined && elevation < 900)
                            ? `${elevation.toFixed(2)} (${datum})`
                            : "--";
                    }
                })();

                // FLOOD LEVEL
                (() => {
                    const floodCell = row.insertCell();

                    floodCell.innerHTML = flood_level;
                })();

                // LWRP LEVEL
                (() => {
                    const lwrpCell = row.insertCell();

                    lwrpCell.innerHTML = lwrp_level;
                })();
            }
        };

        const tableContainer = document.getElementById('table_container_gage_data_cda');

        if (tableContainer) {
            tableContainer.appendChild(table);
        }
    }

    /******************************************************************************
     *                               FETCH CDA FUNCTIONS                          *
     ******************************************************************************/

    function fetchAndUpdateStage(stageCell, tsidStage, flood_level, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOMinus30Hours, setBaseUrl) {
        if (!tsidStage) return;

        const urlStage = `${setBaseUrl}timeseries?name=${tsidStage}&begin=${currentDateTimeISOMinus30Hours}&end=${currentDateTimeISO}&office=${office}`;

        fetch(urlStage, {
            method: 'GET',
            headers: { 'Accept': 'application/json;version=2' }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(stage => {
                console.log("Stage data fetched:", stage);

                let formattedStageData = stage.values.map(entry => {
                    const timestamp = Number(entry[0]);

                    return {
                        ...entry, // Retain other data
                        formattedTimestampUTC: convertUnixTimestamp(timestamp, false),
                        formattedTimestampCST: convertUnixTimestamp(timestamp, true),
                    };
                });
                console.log("formattedStageData:", formattedStageData);

                const lastNonNullValue = formattedStageData[formattedStageData.length - 1];
                console.log("lastNonNullValue:", lastNonNullValue);

                const timestampLastCST = lastNonNullValue['formattedTimestampCST'];
                const timestampLastUTC = lastNonNullValue['formattedTimestampUTC'];
                const valueLast = lastNonNullValue[1].toFixed(2);

                let dateTimeClass = null;
                if (timestampLastUTC) {
                    dateTimeClass = determineDateTimeClass(timestampLastUTC, currentDateTimeISOMinus2Hours);
                }

                const c_count = calculateCCount(tsidStage);
                const lastNonNull24HoursValue = getLastNonNull24HoursValue(stage, c_count);

                let value24HoursLast = null;
                if (lastNonNull24HoursValue) {
                    value24HoursLast = parseFloat(lastNonNull24HoursValue.value).toFixed(2);
                }

                const delta_24 = (value24HoursLast !== null)
                    ? (valueLast - value24HoursLast).toFixed(2)
                    : "N/A";

                const floodClass = determineStageClass(valueLast, flood_level);

                const formattedLastValueTimeStamp = formatTimestamp(timestampLastCST);

                let innerHTMLStage;
                if (valueLast === null) {
                    innerHTMLStage = `
                    <span class='missing'>-M-</span>
                    <span class='temp_water'>label</span>`;
                } else {
                    const displayTime = mobile
                        ? `${formattedLastValueTimeStamp.slice(0, 5)} ${formattedLastValueTimeStamp.slice(11)}`
                        : formattedLastValueTimeStamp;

                    innerHTMLStage = `
                    <div style='white-space: nowrap;'>
                        <span class='${floodClass}' title='Name = ${stage.name}, Value = ${valueLast}, Date Time = ${timestampLastCST}'>
                            <a href='../chart?office=${office}&cwms_ts_id=${stage.name}&lookback=4' target='_blank'>
                                ${valueLast}
                            </a>
                        </span> ${stage.units}
                        (<span title='Delta = (${valueLast} - ${value24HoursLast}) = ${delta_24}'>${delta_24}</span>)
                        <br>
                        <span class='${dateTimeClass}'>${displayTime}</span>
                    </div>`;
                }

                stageCell.innerHTML += innerHTMLStage;
            })
            .catch(error => {
                console.error("Error fetching or processing data:", error);
            });
    }

    function fetchAndUpdateNWS(stageCell, tsidStage, tsid_stage_nws_3_day_forecast, flood_level, currentDateTimeISO, currentDateTimeISOAdd96Hours, setBaseUrl) {
        if (!tsidStage || tsidStage.slice(-2) === "29" || !tsid_stage_nws_3_day_forecast) return;

        const { currentDateTimeMidNightISO, currentDateTimePlus4DaysMidNightISO } = generateDateTimeMidNightStringsISO(currentDateTimeISO, currentDateTimeISOAdd96Hours);

        const urlNWS = `${setBaseUrl}timeseries?name=${tsid_stage_nws_3_day_forecast}&begin=${currentDateTimeMidNightISO}&end=${currentDateTimePlus4DaysMidNightISO}&office=${office}`;

        fetch(urlNWS, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;version=2'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(nws3Days => {
                nws3Days.values.forEach(entry => {
                    entry[0] = formatNWSDate(entry[0]);
                });

                const valuesWithTimeNoon = extractValuesWithTimeNoon(nws3Days.values);

                const getForecastValue = (index) => {
                    const [timestamp, rawValue] = valuesWithTimeNoon?.[index] || [];
                    const value = rawValue != null ? parseFloat(rawValue).toFixed(1) : "";
                    const className = determineStageClass(value, flood_level);
                    return { timestamp, value, className };
                };

                const day1 = getForecastValue(1);
                const day2 = getForecastValue(2);
                const day3 = getForecastValue(3);

                let innerHTMLStage = "";

                if (nws3Days.values.length !== 0) {
                    innerHTMLStage = `
                    <table id="nws">
                        <tr>
                            <td colspan="3" class="day_nws_forecast">3 Day NWS Forecast</td>
                        </tr>
                        <tr>
                            <td class="${day1.className}">
                                <a href="../chart?office=${office}&cwms_ts_id=${nws3Days.name}&lookback=6&lookforward=4" target="_blank" title="${nws3Days.name} ${day1.timestamp}">
                                    ${day1.value}
                                </a>
                            </td>
                            <td class="${day2.className}">
                                <a href="../chart?office=${office}&cwms_ts_id=${nws3Days.name}&lookback=6&lookforward=4" target="_blank" title="${nws3Days.name} ${day2.timestamp}">
                                    ${day2.value}
                                </a>
                            </td>
                            <td class="${day3.className}">
                                <a href="../chart?office=${office}&cwms_ts_id=${nws3Days.name}&lookback=6&lookforward=4" target="_blank" title="${nws3Days.name} ${day3.timestamp}">
                                    ${day3.value}
                                </a>
                            </td>
                        </tr>
                    </table>`;
                } else {
                    innerHTMLStage = `<span class="day_nws_forecast">NWS 3 Days Forecast</span>`;
                }

                stageCell.innerHTML += innerHTMLStage;
            })
            .catch(error => {
                console.error("Error fetching or processing data:", error);
            });
    }

    function fetchAndUpdateFlow(flowCell, tsidFlow, label, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOMinus30Hours, setBaseUrl) {
        if (!tsidFlow) return;

        const urlFlow = `${setBaseUrl}timeseries?name=${tsidFlow}&begin=${currentDateTimeISOMinus30Hours}&end=${currentDateTimeISO}&office=${office}`;

        fetch(urlFlow, {
            method: 'GET',
            headers: {
                'Accept': 'application/json;version=2'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(flow => {
                flow.values.forEach(entry => {
                    entry[0] = formatNWSDate(entry[0]);
                });

                const labelClassMap = {
                    COE: "flow_coe",
                    USGS: "flow_usgs",
                    NWS: "flow_nws",
                    MVR: "flow_coe_mvr",
                    USGSRAW: "flow_usgsraw",
                    SLOPEADJ: "flow_slopeadj"
                };
                const myFlowLabelClass = labelClassMap[label] || "flow";

                const lastNonNullFlowValue = getLastNonNullValue(flow);
                if (!lastNonNullFlowValue) {
                    flowCell.innerHTML += `
                    <span class='missing'>-M-</span>
                    <span class='temp_water'>label</span>
                `;
                    return;
                }

                const timestampFlowLast = lastNonNullFlowValue.timestamp;
                const valueFlowLast = parseFloat(lastNonNullFlowValue.value).toFixed(0);
                const timestampFlowLastIso = convertToIsoTimestamp(timestampFlowLast);
                const dateTimeClass = determineDateTimeClass(timestampFlowLastIso, currentDateTimeISOMinus2Hours);

                const c_count = calculateCCount(tsidFlow);
                const lastNonNull24HoursFlowValue = getLastNonNull24HoursValue(flow, c_count);

                let delta24Flow = 0;
                let valueFlow24HoursLast = 0;
                if (lastNonNull24HoursFlowValue) {
                    valueFlow24HoursLast = parseFloat(lastNonNull24HoursFlowValue.value).toFixed(0);
                    delta24Flow = (valueFlowLast - valueFlow24HoursLast).toFixed(0);
                }

                const roundedDelta24Flow = formatFlowValue(delta24Flow);
                const roundedValueFlowLast = formatFlowValue(valueFlowLast);
                const formattedLastValueTimeStamp = formatTimestampToStringIOS(timestampFlowLast);

                const displayTime = mobile
                    ? `${timestampFlowLast.slice(0, 5)} ${timestampFlowLast.slice(11)}`
                    : timestampFlowLast;

                flowCell.innerHTML += `
                <div style='white-space: nowrap;'>
                    <span class='last_max_value' title='${flow.name}, Value = ${roundedValueFlowLast}, Date Time = ${timestampFlowLast}'>
                        <a href='../chart?office=${office}&cwms_ts_id=${flow.name}&lookback=4' target='_blank'>
                            ${roundedValueFlowLast}
                        </a>
                    </span> ${flow.units}
                    (<span title='${flow.name}, Value = ${roundedValueFlowLast}, Date Time = ${lastNonNull24HoursFlowValue?.timestamp || '-'}, Delta = (${valueFlowLast} - ${valueFlow24HoursLast}) = ${roundedDelta24Flow}'>
                        ${roundedDelta24Flow}
                    </span>)
                    <br>
                    <span class='${"--"}'>${displayTime}</span>
                    <span class='${myFlowLabelClass}'>${label}</span>
                </div>
            `;
            })
            .catch(error => {
                console.error("Error fetching or processing data:", error);
            });
    }

    function fetchAndUpdatePrecip(precipCell, tsid, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOMinus30Hours, setBaseUrl) {
        if (!tsid) {
            precipCell.innerHTML = "";
            return;
        }

        const urlPrecip = `${setBaseUrl}timeseries?name=${tsid}&begin=${currentDateTimeISOMinus30Hours}&end=${currentDateTimeISO}&office=${office}`;

        fetch(urlPrecip, {
            method: 'GET',
            headers: { 'Accept': 'application/json;version=2' }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(precip => {
                // Format timestamps in the response
                precip.values.forEach(entry => { entry[0] = formatNWSDate(entry[0]); });

                const lastValue = getLastNonNullValue(precip);
                if (!lastValue) {
                    precipCell.innerHTML = `
                    <table id='precip'>
                        <tr>
                            <td class='precip_missing' title='6 hr delta'></td>
                            <td class='precip_missing' title='24 hr delta'></td>
                        </tr>
                    </table>`;
                    return;
                }

                // Parse last value details
                const timestampLast = lastValue.timestamp;
                const valueLast = parseFloat(lastValue.value).toFixed(2);
                const qualityCodeLast = lastValue.qualityCode;

                // Determine class based on timestamp
                const [month, day, year, time] = timestampLast.split(/[-\s:]/);
                const isoTimestampLast = new Date(`${year}-${month}-${day}T${time}:00Z`).toISOString();
                const dateTimeClass = determineDateTimeClass(isoTimestampLast, currentDateTimeISOMinus2Hours);

                const cCount = calculateCCount(tsid);

                // Get 6-hour and 24-hour last non-null values
                const last6HrValue = getLastNonNull6HoursValue(precip, cCount);
                const last24HrValue = getLastNonNull24HoursValue(precip, cCount);

                // Helper to parse values safely
                const parseValue = v => v ? parseFloat(v.value).toFixed(2) : null;

                const value6Hr = parseValue(last6HrValue);
                const value24Hr = parseValue(last24HrValue);

                // Calculate deltas safely (fallback to 0 if values missing)
                const delta6 = value6Hr !== null ? (valueLast - value6Hr).toFixed(2) : null;
                const delta24 = value24Hr !== null ? (valueLast - value24Hr).toFixed(2) : null;

                // Function to get CSS class for delta values
                const getPrecipClass = (delta) => {
                    if (delta === null) return "precip_missing";
                    const d = parseFloat(delta);
                    if (d < 0) return "precip_less_0";
                    if (d === 0) return "precip_equal_0";
                    if (d > 0 && d <= 0.25) return "precip_greater_0";
                    if (d > 0.25 && d <= 0.50) return "precip_greater_25";
                    if (d > 0.50 && d <= 1.00) return "precip_greater_50";
                    if (d > 1.00 && d <= 2.00) return "precip_greater_100";
                    if (d > 2.00) return "precip_greater_200";
                    return "blank";
                };

                const class6 = getPrecipClass(delta6);
                const class24 = getPrecipClass(delta24);

                const displayTime = mobile
                    ? timestampLast.slice(0, 5) + ' ' + timestampLast.slice(11)
                    : timestampLast;

                // Build the HTML content
                const innerHTMLPrecip = `
                <div style='text-align: center;'>
                    <div style='display: inline-block;'>
                        <table id='precip'>
                            <tr>
                                <td class='${class6}' title='6 hr delta'>
                                    <span style='padding: 0 10px;' title='${precip.name}, Value = ${value6Hr}, Date Time = ${last6HrValue?.timestamp}, Delta = (${valueLast} - ${value6Hr}) = ${delta6}'>
                                        ${delta6 ?? "-M-"}
                                    </span>
                                </td>
                                <td class='${class24}' title='24 hr delta'>
                                    <span style='padding: 0 10px;' title='${precip.name}, Value = ${value24Hr}, Date Time = ${last24HrValue?.timestamp}, Delta = (${valueLast} - ${value24Hr}) = ${delta24}'>
                                        ${delta24 ?? "-M-"}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <br>
                    <span class='last_max_value' title='${precip.name}, Value = ${valueLast}, Date Time = ${timestampLast}'>
                        <a href='../chart?office=${office}&cwms_ts_id=${precip.name}&lookback=4' target='_blank'>
                            ${valueLast}
                        </a>
                    </span>
                    ${precip.units}
                    <br>
                    <span class='${"--"}'>${displayTime}</span>
                </div>`;

                precipCell.innerHTML += innerHTMLPrecip;
            })
            .catch(error => console.error("Error fetching or processing data:", error));
    }

    function fetchAndUpdateWaterQuality(waterQualityCell, tsid, label, currentDateTimeISOMinus2Hours, currentDateTimeISO, currentDateTimeISOAdd30Hours, currentDateTimeISOMinus30Hours, setBaseUrl) {
        if (!tsid) {
            return;
        }

        const url = `${setBaseUrl}timeseries?name=${tsid}&begin=${currentDateTimeISOMinus30Hours}&end=${currentDateTimeISO}&office=${office}`;

        fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json;version=2' }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(waterQuality => {
                // Format timestamps in values array
                waterQuality.values.forEach(entry => entry[0] = formatNWSDate(entry[0]));

                // Determine water quality class based on label
                const labelLower = (label || "").toLowerCase();
                const classesMap = {
                    air: "water_quality_temp_air",
                    water: "water_quality_temp_water",
                    do: "water_quality_do",
                    depth: "water_quality_depth",
                    cond: "water_quality_cond",
                    ph: "water_quality_ph",
                    turb: "water_quality_turb",
                    speed: "water_quality_speed_wind",
                    pressure: "water_quality_pressure",
                    dir: "water_quality_dir_wind",
                    nitrate: "water_quality_nitrate",
                    chlorophyll: "water_quality_chlorophyll",
                    phycocyanin: "water_quality_phycocyanin",
                };
                const myWaterQualityClass = Object.entries(classesMap).find(([key]) => labelLower.includes(key))?.[1] || "water_quality_do";

                // Get last non-null water quality value
                const lastValueObj = getLastNonNullValue(waterQuality);
                if (!lastValueObj) {
                    waterQualityCell.innerHTML += `<span class='missing' title='${waterQuality.name}'>-M-</span><span class='${myWaterQualityClass}'>${label}</span>`;
                    return;
                }

                // Parse last value details
                const timestampLast = lastValueObj.timestamp;
                const valueLast = parseFloat(lastValueObj.value).toFixed(0);

                // Determine datetime class
                const [month, day, year, time] = timestampLast.split(/[-\s:]/);
                const timestampLastIso = new Date(`${year}-${month}-${day}T${time}:00Z`).toISOString();
                const dateTimeClass = determineDateTimeClass(timestampLastIso, currentDateTimeISOMinus2Hours);

                // Calculate 24-hour previous value and delta
                const cCount = calculateCCount(tsid);
                const last24ValueObj = getLastNonNull24HoursValue(waterQuality, cCount);

                let value24 = null;
                let timestamp24 = null;
                if (last24ValueObj) {
                    value24 = parseFloat(last24ValueObj.value).toFixed(0);
                    timestamp24 = last24ValueObj.timestamp;
                }

                const delta24 = (value24 !== null) ? (valueLast - value24).toFixed(0) : "-";

                // Display time formatting
                const displayTime = mobile
                    ? timestampLast.slice(0, 5) + ' ' + timestampLast.slice(11)
                    : timestampLast;

                // Build innerHTML based on value thresholds
                const valueClass = (valueLast > 1000) ? "blinking-text" : "last_max_value";

                const innerHTMLWaterQuality = `
                                                <div style="white-space: nowrap;">
                                                    <span class="${valueClass}" title="${waterQuality.name}, Value = ${valueLast}, Date Time = ${timestampLast}">
                                                        <a href="../chart?office=${office}&cwms_ts_id=${waterQuality.name}&lookback=4" target="_blank">${valueLast}</a>
                                                    </span> 
                                                    ${waterQuality.units} 
                                                    (<span title="${waterQuality.name}, Value = ${value24}, Date Time = ${timestamp24}, Delta = (${valueLast} - ${value24}) = ${delta24}">
                                                        ${delta24}
                                                    </span>)<br>
                                                    <span class="${"--"}">${displayTime}</span>
                                                    <span class="${myWaterQualityClass}">${label}</span>
                                                </div>`;

                waterQualityCell.innerHTML += innerHTMLWaterQuality;
            })
            .catch(error => {
                console.error("Error fetching or processing data:", error);
            });
    }

    /******************************************************************************
     *                           DATA FUNCTIONS                                   *
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

    /******************************************************************************
     *                            CLASSES FUNCTIONS                               *
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

    function determineDateTimeClass(iso1, iso2) {
        const date1 = new Date(iso1);
        const date2 = new Date(iso2);

        var myDateTimeClass;
        if (date1 >= date2) {
            myDateTimeClass = "date_time_current";
        } else {
            myDateTimeClass = "blinking-text";
        }
        return myDateTimeClass;
    }

    function determineDateTimeClassWaterQuality(formattedDate, currentDateTimeISOMinus2Hours, currentDateTimeISOMinus8Hours, label) {
        let myDateTimeClass;

        // Handle undefined or non-string labels
        if (!label || typeof label !== "string") {
            console.warn("Warning: Invalid or undefined label:", label);
            label = ""; // Assign an empty string to prevent `.includes()` errors
        }

        if (label.includes("LPMS")) {
            if (formattedDate >= currentDateTimeISOMinus8Hours) {
                myDateTimeClass = "date_time_current";
            } else {
                myDateTimeClass = "date_time_late";
            }
        } else {
            if (formattedDate >= currentDateTimeISOMinus2Hours) {
                myDateTimeClass = "date_time_current";
            } else {
                myDateTimeClass = "date_time_late";
            }
        }

        return myDateTimeClass;
    }

    /******************************************************************************
     *                            SUPPORT FUNCTIONS                               *
     ******************************************************************************/

    function filterByLocationCategory(array, category) {
        return array.filter(item =>
            item['location-category'] &&
            item['location-category']['office-id'] === category['office-id'] &&
            item['location-category']['id'] === category['id']
        );
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

    function generateDateTimeMidNightStringsISO(currentDateTimeISO, currentDateTimeISOAdd96Hours) {
        // Convert ISO strings to Date objects
        const currentDateTime = new Date(currentDateTimeISO);
        const currentDateTimePlus96Hours = new Date(currentDateTimeISOAdd96Hours);

        // Get midnight in Central Time for currentDateTime
        const midnightCentralCurrent = new Date(
            new Date(currentDateTime.toLocaleDateString('en-US', { timeZone: 'America/Chicago' }))
        );
        midnightCentralCurrent.setHours(0, 0, 0, 0);
        const currentDateTimeMidNightISO = midnightCentralCurrent.toISOString();

        // Get midnight in Central Time for currentDateTimePlus96Hours
        const midnightCentralPlus4Days = new Date(
            new Date(currentDateTimePlus96Hours.toLocaleDateString('en-US', { timeZone: 'America/Chicago' }))
        );
        midnightCentralPlus4Days.setHours(0, 0, 0, 0);
        const currentDateTimePlus4DaysMidNightISO = midnightCentralPlus4Days.toISOString();

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

    function subtractHoursCentralTime(isoString, hoursToSubtract) {
        const date = new Date(isoString);
        date.setHours(date.getHours() - hoursToSubtract);

        const options = {
            timeZone: 'America/Chicago',
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };

        const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
        const get = (type) => parts.find(p => p.type === type).value;

        return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
    }

    function subtractHoursFromUTC(isoString, hoursToSubtract) {
        // Create Date from UTC string
        const date = new Date(isoString);

        // Subtract hours using UTC methods
        date.setUTCHours(date.getUTCHours() - hoursToSubtract);

        // Format the result as a UTC ISO string (YYYY-MM-DDTHH:mm:ssZ)
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minute = String(date.getUTCMinutes()).padStart(2, '0');
        const second = String(date.getUTCSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }

    function addHoursFromUTC(isoString, hoursToSubtract) {
        // Create Date from UTC string
        const date = new Date(isoString);

        // Subtract hours using UTC methods
        date.setUTCHours(date.getUTCHours() + hoursToSubtract);

        // Format the result as a UTC ISO string (YYYY-MM-DDTHH:mm:ssZ)
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minute = String(date.getUTCMinutes()).padStart(2, '0');
        const second = String(date.getUTCSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }

    function subtractHoursFromCentralTime(isoString, hoursToSubtract) {
        const date = new Date(isoString);

        // Get the offset (in minutes) for America/Chicago at that time
        const centralOffsetMinutes = -new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Chicago',
            timeZoneName: 'short'
        }).formatToParts(date).find(part => part.type === 'timeZoneName').value.includes('CDT') ? 300 : 360;

        // Convert to Central Time by applying offset
        const centralTime = new Date(date.getTime() - centralOffsetMinutes * 60 * 1000);

        // Subtract hours
        centralTime.setHours(centralTime.getHours() - hoursToSubtract);

        // Convert back to UTC
        const adjustedUTC = new Date(centralTime.getTime() + centralOffsetMinutes * 60 * 1000);

        // Format to ISO string
        const year = adjustedUTC.getUTCFullYear();
        const month = String(adjustedUTC.getUTCMonth() + 1).padStart(2, '0');
        const day = String(adjustedUTC.getUTCDate()).padStart(2, '0');
        const hour = String(adjustedUTC.getUTCHours()).padStart(2, '0');
        const minute = String(adjustedUTC.getUTCMinutes()).padStart(2, '0');
        const second = String(adjustedUTC.getUTCSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }

    function addHoursCentralTime(isoString, hoursToAdd) {
        const date = new Date(isoString);
        date.setHours(date.getHours() + hoursToAdd);

        const options = {
            timeZone: 'America/Chicago',
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };

        const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
        const get = (type) => parts.find(p => p.type === type).value;

        return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
    }

    function minusHoursCentralTime(isoString, hoursToAdd) {
        const date = new Date(isoString);
        date.setHours(date.getHours() - hoursToAdd);

        const options = {
            timeZone: 'America/Chicago',
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };

        const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
        const get = (type) => parts.find(p => p.type === type).value;

        return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
    }

    function subtract2HoursFromISO(isoString) {
        const date = new Date(isoString);
        date.setHours(date.getHours() - 2);
        return date.toISOString();
    }

    function formatFlowValue(value) {
        const floatVal = parseFloat(value);
        return (Math.abs(floatVal) >= 1000)
            ? (Math.round(floatVal / 10) * 10).toLocaleString()
            : floatVal.toLocaleString();
    }

    function convertToIsoTimestamp(timestampStr) {
        const [month, day, year, time] = timestampStr.split(/[-\s:]/);
        return new Date(`${year}-${month}-${day}T${time}:00Z`).toISOString();
    }

    function convertUnixTimestamp(timestamp, toCST = false) {
        if (typeof timestamp !== "number") {
            console.error("Invalid timestamp:", timestamp);
            return "Invalid Date";
        }

        const dateUTC = new Date(timestamp); // Convert milliseconds to Date object
        if (isNaN(dateUTC.getTime())) {
            console.error("Invalid date conversion:", timestamp);
            return "Invalid Date";
        }

        if (!toCST) {
            return dateUTC.toISOString(); // Return UTC time
        }

        // Convert to CST/CDT (America/Chicago) while adjusting for daylight saving time
        const options = { timeZone: "America/Chicago", hour12: false };
        const cstDateString = dateUTC.toLocaleString("en-US", options);
        const cstDate = new Date(cstDateString + " UTC"); // Convert back to Date

        return cstDate.toISOString();
    }

    function formatTimestamp(isoString) {
        const date = new Date(isoString);

        // Get parts of the date in UTC
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months 0-11
        const day = String(date.getUTCDate()).padStart(2, '0');
        const year = date.getUTCFullYear();

        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');

        return `${month}-${day}-${year} ${hours}:${minutes}`;
    }
});