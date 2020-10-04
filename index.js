const covidHints = {
  prevention: [
    "wash hands regularly with soap and water, or clean them with alcohol-based hand rub",
    "maintain at least 1 metre distance between you and people coughing or sneezing",
    "avoid touching your face",
    "cover your mouth and nose when coughing or sneezing",
    "stay home if you feel unwell",
    "refrain from smoking and other activities that weaken the lungs",
    "avoid unnecessary travel and stay away from large groups of people",
  ],
  symptoms: [
    "fever",
    "dry cough",
    "tiredness",
    "aches and pains",
    "sore throat",
    "diarrhoea",
    "headache",
    "loss of taste and smell",
    "difficulty breathing or shortness of breath",
    "chest pain or pressure",
  ],
};

const preventionParagraph = document.getElementById("prevention");
let x = "";
covidHints.prevention.forEach((hint) => {
  x += `${hint}, `;
});
preventionParagraph.innerHTML = x;

const toggleButton = document.getElementById("toggle-button");
toggleButton.addEventListener("click", switchCases);

async function switchCases() {
  //flag for event handler of switching button
  let toggleFlag = toggleButton.classList.toggle("active");
  const response2 = await fetch(
    "https://covid.ourworldindata.org/data/owid-covid-data.json"
  );
  const res2 = await response2.json();
  updateHistogramCases(res2, toggleFlag);
}

const updateGlobalNumberCases = (apiData) => {
  const confirmed = document.getElementById("global_confirmed");
  const todayConfirmed = document.getElementById("today_confirmed");
  const activeConfirmed = document.getElementById("active_confirmed");
  const deaths = document.getElementById("global_deaths");
  const todayDeaths = document.getElementById("today_deaths");
  const recovered = document.getElementById("global_recovered");

  //confirmed cases
  confirmedText = document.createTextNode(
    Number(apiData[0].cases).toLocaleString()
  );
  confirmed.appendChild(confirmedText);

  todayConfirmedText = document.createTextNode(
    Number(apiData[0].todayCases).toLocaleString()
  );
  todayConfirmed.appendChild(todayConfirmedText);

  activeConfirmedText = document.createTextNode(
    Number(apiData[0].active).toLocaleString()
  );
  activeConfirmed.appendChild(activeConfirmedText);

  //deaths cases
  deathsText = document.createTextNode(
    Number(apiData[0].deaths).toLocaleString()
  );
  deaths.appendChild(deathsText);

  todayDeathsText = document.createTextNode(
    Number(apiData[0].todayDeaths).toLocaleString()
  );
  todayDeaths.appendChild(todayDeathsText);

  //recovered cases
  recoveredText = document.createTextNode(
    Number(apiData[0].recovered).toLocaleString()
  );
  recovered.appendChild(recoveredText);
};

const updateHistogramCases = (apiData, flag) => {
  //api format => {"country-code": {..., "data": [{"data": "", "total_cases": "", ...},{}, ...]}, "country-code": {}, ...}

  //OWID_WRL - property for world cases
  const worldByDates = apiData["OWID_WRL"]["data"];
  const format = d3.timeParse("%Y-%m-%d");
  const data = worldByDates.map((country) => {
    const date = format(country.date);
    const cases = country.new_cases;
    const deaths = country.new_deaths;
    return { date, cases, deaths };
  });
  //console.log(data);

  const padding = { top: 30, right: 20, bottom: 20, left: 50 };

  let width = document.getElementById("world-chart").clientWidth;
  let height = document.getElementById("world-chart").clientHeight;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  //remove svg if its already created
  d3.select("#world-chart").select("svg").remove();

  //select area to append svg
  const svg = d3
    .select("#world-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  //create scales - scaleBand() for ordinal or categorical dimensions (letters)
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, (d) => {
        if (flag) return d.deaths;
        else return d.cases;
      }),
    ])
    .range([innerHeight, 0]);

  const g = svg
    .append("g")
    .attr("transform", `translate(${padding.left},${padding.top + -20})`);

  g.append("g").call(d3.axisLeft(yScale));
  g.append("g")
    .call(d3.axisBottom(xScale))
    .attr("transform", `translate(0, ${innerHeight})`);

  const tooltip = d3
    .select("#world-chart")
    .append("div")
    .attr("id", "tooltip-chart");
  tooltip.append("div").attr("class", "tooltip-chart-date");
  tooltip.append("div").attr("class", "tooltip-chart-num");

  const bars = g
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.date))
    .attr("y", (d) => {
      if (flag) return yScale(d.deaths);
      else return yScale(d.cases);
    })
    .attr("height", 0)
    .attr("width", innerWidth / data.length);

  //assigning rectangulars to variable bars because with transition() they become
  //transition so we cant select them with mouse events
  bars
    .transition()
    .duration(200)
    .delay((d, i) => i * 50)
    .attr("height", (d, i) => {
      if (flag) return innerHeight - yScale(d.deaths);
      else return innerHeight - yScale(d.cases);
    });

  bars
    .on("mouseover", onMouseOver)
    .on("mouseout", onMouseOut)
    .on("mousemove", onMouseMove);

  //mouse event handler functions
  function onMouseOver(d, i) {
    d3.select(this).attr("class", "highlight");
    const formatDate = d3.timeFormat("%B %d, %Y");
    tooltip.select(".tooltip-chart-date").html(`Date: ${formatDate(d.date)}`);
    if (flag) {
      tooltip
        .select(".tooltip-chart-num")
        .html(`Daily deaths: ${d.deaths.toLocaleString()}`);
    } else {
      tooltip
        .select(".tooltip-chart-num")
        .html(`Daily cases: ${d.cases.toLocaleString()}`);
    }
    tooltip.style("display", "block");
  }

  function onMouseOut(d, i) {
    d3.select(this).attr("class", "non-highlight");
    tooltip.style("display", "none");
  }

  function onMouseMove(d, i) {
    tooltip.style("top", 10 + "px").style("left", padding.left + 20 + "px");
    // if we wanna mouse positions
    // tooltip
    //   .style("top", d3.event.pageY + 10 + "px")
    //   .style("left", d3.event.pageX + 10 + "px");
  }
};

const updateContinentCases = (apiData) => {
  //make format [{data: continent, confirmed: num, deaths: num}, {}, ....]
  let confirmedAsia = 0;
  let confirmedEurope = 0;
  let confirmedNorthAmerica = 0;
  let confirmedSouthAmerica = 0;
  let confirmedAfrica = 0;
  let confirmedAustralia = 0;
  let deathsAsia = 0;
  let deathsEurope = 0;
  let deathsNorthAmerica = 0;
  let deathsSouthAmerica = 0;
  let deathsAfrica = 0;
  let deathsAustralia = 0;
  let countries = [];

  //push all continents into array and sum number of cases for continents
  Object.keys(apiData).forEach((country) => {
    if ("continent" in apiData[country]) {
      countries.push(apiData[country]["continent"]);
      if ("total_cases" in apiData[country]["data"].slice(-1)[0]) {
        if (apiData[country]["continent"] === "Africa") {
          confirmedAfrica += apiData[country]["data"].slice(-1)[0][
            "total_cases"
          ];
          deathsAfrica += apiData[country]["data"].slice(-1)[0]["total_deaths"];
        } else if (apiData[country]["continent"] === "Asia") {
          confirmedAsia += apiData[country]["data"].slice(-1)[0]["total_cases"];
          deathsAsia += apiData[country]["data"].slice(-1)[0]["total_deaths"];
        } else if (apiData[country]["continent"] === "Oceania") {
          confirmedAustralia += apiData[country]["data"].slice(-1)[0][
            "total_cases"
          ];
          deathsAustralia += apiData[country]["data"].slice(-1)[0][
            "total_deaths"
          ];
        } else if (apiData[country]["continent"] === "Europe") {
          confirmedEurope += apiData[country]["data"].slice(-1)[0][
            "total_cases"
          ];
          deathsEurope += apiData[country]["data"].slice(-1)[0]["total_deaths"];
        } else if (apiData[country]["continent"] === "North America") {
          confirmedNorthAmerica += apiData[country]["data"].slice(-1)[0][
            "total_cases"
          ];
          deathsNorthAmerica += apiData[country]["data"].slice(-1)[0][
            "total_deaths"
          ];
        } else {
          confirmedSouthAmerica += apiData[country]["data"].slice(-1)[0][
            "total_cases"
          ];
          deathsSouthAmerica += apiData[country]["data"].slice(-1)[0][
            "total_deaths"
          ];
        }
      }
    }
  });

  const totalConfirmed =
    confirmedAfrica +
    confirmedAsia +
    confirmedAustralia +
    confirmedEurope +
    confirmedNorthAmerica +
    confirmedSouthAmerica;
  const totalDeaths =
    deathsAfrica +
    deathsAsia +
    deathsAustralia +
    deathsEurope +
    deathsNorthAmerica +
    deathsSouthAmerica;

  const uniqueContinents = Array.from(new Set(countries));
  let data = [];
  uniqueContinents.forEach((continent) => {
    let obj = {
      continent: `${continent}`,
      confirmed: `${
        continent === "Africa"
          ? confirmedAfrica
          : continent === "Asia"
          ? confirmedAsia
          : continent === "Europe"
          ? confirmedEurope
          : continent === "Oceania"
          ? confirmedAustralia
          : continent === "North America"
          ? confirmedNorthAmerica
          : confirmedSouthAmerica
      }`,
      deaths: `${
        continent === "Africa"
          ? deathsAfrica
          : continent === "Asia"
          ? deathsAsia
          : continent === "Europe"
          ? deathsEurope
          : continent === "Oceania"
          ? deathsAustralia
          : continent === "North America"
          ? deathsNorthAmerica
          : deathsSouthAmerica
      }`,
      percentageConfirmed: `${
        continent === "Africa"
          ? Math.round((confirmedAfrica / totalConfirmed) * 100)
          : continent === "Asia"
          ? Math.round((confirmedAsia / totalConfirmed) * 100)
          : continent === "Europe"
          ? Math.round((confirmedEurope / totalConfirmed) * 100)
          : continent === "Oceania"
          ? Math.round((confirmedAustralia / totalConfirmed) * 100)
          : continent === "North America"
          ? Math.round((confirmedNorthAmerica / totalConfirmed) * 100)
          : Math.round((confirmedSouthAmerica / totalConfirmed) * 100)
      }`,
      percentageDeaths: `${
        continent === "Africa"
          ? Math.round((deathsAfrica / totalDeaths) * 100)
          : continent === "Asia"
          ? Math.round((deathsAsia / totalDeaths) * 100)
          : continent === "Europe"
          ? Math.round((deathsEurope / totalDeaths) * 100)
          : continent === "Oceania"
          ? Math.round((deathsAustralia / totalDeaths) * 100)
          : continent === "North America"
          ? Math.round((deathsNorthAmerica / totalDeaths) * 100)
          : Math.round((deathsSouthAmerica / totalDeaths) * 100)
      }`,
    };
    data.push(obj);
  });

  //make pie chart
  const makePieChart = (divSelector, isPieConfirmed) => {
    const padding = { top: 20, right: 20, bottom: 20, left: 20 };
    let width = document.getElementById(`${divSelector}`).clientWidth;
    let height = document.getElementById(`${divSelector}`).clientHeight;
    let radius = Math.min(width, height) / 2.5;

    const svg = d3
      .select(`#${divSelector}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    //generating angles of each pie
    const pieData = d3
      .pie()
      .value((d) => (isPieConfirmed === true ? d.confirmed : d.deaths))(data);
    //console.log(pieData);

    const myColor = d3.scaleOrdinal().domain(pieData).range(d3.schemeSet3);

    const arc = d3
      .arc()
      .innerRadius(55) //0 for pie; > 0 for donut
      .outerRadius(radius)
      .padAngle(0.05)
      .padRadius(0);
    //.cornerRadius(4);

    const label = d3
      .arc()
      .outerRadius(radius)
      .innerRadius(radius - 80);

    const tooltip = d3
      .select(`#${divSelector}`)
      .append("div")
      .attr("class", "tooltip-pie")
      .attr(
        "id",
        `${isPieConfirmed === true ? "tip-confirmed" : "tip-deaths"}`
      );
    tooltip.append("div").attr("class", "tooltip-continent");
    tooltip.append("div").attr("class", "tooltip-total");

    const sections = svg
      .selectAll("g")
      .data(pieData)
      .enter()
      .append("g")
      .attr("transform", () => {
        if (isPieConfirmed)
          return `translate(${width / 2 - radius + 60},${height / 2})`;
        else return `translate(${width / 2},${height / 2})`;
      })
      .on("mouseover", function (d) {
        //defining current selected and non-selected objects
        const current = this;
        const others = svg.selectAll("g").filter(function (el) {
          return this != current;
        });
        others.selectAll("path").style("opacity", 0.7);
        //divs for showing number of cases
        tooltip.select(".tooltip-continent").html(d.data.continent);
        tooltip
          .select(".tooltip-total")
          .html(
            `${isPieConfirmed === true ? d.data.confirmed : d.data.deaths}`
          );
        tooltip.style("display", "block");
      })
      .on("mouseout", function (d) {
        const current = this;
        d3.select(this).style("opacity", 1);
        const others = svg.selectAll("g").filter(function (el) {
          return this != current;
        });
        others.selectAll("path").style("opacity", 1);
        tooltip.style("display", "none");
      })
      .on("mousemove", () => {
        tooltip.style("top", `${height / 2 - 35}px`);
        if (isPieConfirmed) {
          tooltip.style("left", `${width / 2 - radius + 20}px`);
        } else {
          tooltip.style("left", `${width / 2 - 40}px`);
        }
      });

    sections
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => myColor(i));

    //for percentages
    sections
      .append("text")
      .attr("transform", (d) => `translate(${label.centroid(d)})`)
      .text(
        (d, i) =>
          `${
            isPieConfirmed === true
              ? d.data.percentageConfirmed
              : d.data.percentageDeaths
          }%`
      );

    if (isPieConfirmed) {
      const legend = svg
        .append("g")
        .attr("transform", `translate(${width - 130}, ${height / 3})`)
        .selectAll("legend")
        .data(pieData)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`);

      legend
        .append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", (d, i) => myColor(i));

      legend
        .append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text((d) => d.data.continent)
        .style("fill", "white");
    }

    //chart title
    svg
      .append("g")
      .attr("transform", "translate(" + 30 + "," + 20 + ")")
      .append("text")
      .text(
        `${
          isPieConfirmed === true
            ? "Total confirmed cases"
            : "Total death cases"
        }`
      )
      // .style("fill", "white")
      .attr("class", "pie-chart-title");
  };
  makePieChart("pie-chart-confirmed", true);
  makePieChart("pie-chart-deaths", false);
};

const getData = async () => {
  const response = await fetch(
    "https://coronavirus-19-api.herokuapp.com/countries"
  );
  const res = await response.json();
  updateGlobalNumberCases(res);

  const response2 = await fetch(
    "https://covid.ourworldindata.org/data/owid-covid-data.json"
  );
  const res2 = await response2.json();
  //first time toggle flag is false
  updateHistogramCases(res2, false);
  updateContinentCases(res2);
};

getData();
