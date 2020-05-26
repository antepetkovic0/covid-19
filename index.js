//radio buttons
const rbc = document.getElementById('rb_c');
const rbd = document.getElementById('rb_d');
const rbr = document.getElementById('rb_r');

const createMap = (data, world) => {
  let width = document.getElementById('two').offsetWidth;
  let height = document.getElementById('two').offsetHeight;
  let centered;
  const apiData = data;

  const legendText = [
    '> 100 000',
    '10 000 - 100 000',
    '1 000 - 10 000',
    '100 - 1 000',
    '< 100',
    'unavailable data'
  ];

  //remove svg if its already created
  d3.select('#two')
    .select('svg')
    .remove();

  const svg = d3
    .select('#two')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const projection = d3.geoEquirectangular();
  const path = d3.geoPath().projection(projection);
  const map = svg.append('g');
  const legend = svg.append('g').attr('transform', `translate(-70,210)`);

  var color = d3
    .scaleOrdinal()
    .domain(legendText)
    .range(d3.schemeSet1);

  //add dots in legend
  legend
    .selectAll('mydots')
    .data(legendText)
    .enter()
    .append('circle')
    .attr('cx', 100)
    .attr('cy', function(d, i) {
      return 100 + i * 25;
      // 100 - where the first dot appears, 25 - distance between dots
    })
    .attr('r', 7)
    .style('fill', function(d) {
      return color(d);
    });

  //add labels for dots in legend
  legend
    .selectAll('mylabels')
    .data(legendText)
    .enter()
    .append('text')
    .attr('x', 120)
    .attr('y', function(d, i) {
      return 100 + i * 25;
    })
    .style('fill', function(d) {
      return color(d);
    })
    .text(function(d) {
      return d;
    })
    .attr('text-anchor', 'left')
    .style('alignment-baseline', 'middle');

  map
    .append('path')
    .datum({ type: 'Sphere' })
    .attr('class', 'mapOcean')
    .attr('d', path);

  map
    .selectAll('path')
    .data(topojson.feature(world, world.objects.countries).features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', colorCountry)
    .on('click', zoomToCountry)
    .append('title')
    .text(d => {
      return d.properties.name;
    });

  function colorCountry(d) {
    //country name = d.properties.name
    //filter country object
    const c = apiData.locations.find(x => x.country === d.properties.name);
    if (c) {
      const color =
        c.latest < 100
          ? '#ff7f00'
          : c.latest < 1000
          ? '#984ea3'
          : c.latest < 10000
          ? '#4daf4a'
          : c.latest < 100000
          ? '#377eb8'
          : '#e41a1c';
      return color;
    } else {
      //countries not found in API
      return '#e6e075';
    }
  }

  function zoomToCountry(d) {
    let x, y, k;
    if (d && centered !== d) {
      var centroid = path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = d;
    } else {
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }

    map.selectAll('path').classed(
      'active',
      centered &&
        function(d) {
          return d === centered;
        }
    );

    map
      .transition()
      .duration(750)
      .attr(
        'transform',
        'translate(' +
          width / 2 +
          ',' +
          height / 2 +
          ')scale(' +
          k +
          ')translate(' +
          -x +
          ',' +
          -y +
          ')'
      )
      .style('stroke-width', 1.5 / k + 'px');
  }
};

const getWorld = async () => {
  const response = await d3.json(
    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
  );
  return response;
};

const getDate = date => {
  //date => 2020-05-16T08:09:05.956567Z
  const splitted = date.split('T');
  const splittedTime = splitted[1].split('.');
  return ` ${splitted[0]}, ${splittedTime[0]}`;
};

const updateGlobalContainers = data => {
  //confirmed cases
  const confirmed = document.getElementById('global_confirmed');
  const cUpdate = document.getElementById('confirmed_update');
  //recovered cases
  const recovered = document.getElementById('global_recovered');
  const rUpdate = document.getElementById('recovered_update');
  //death cases
  const deaths = document.getElementById('global_deaths');
  const dUpdate = document.getElementById('deaths_update');

  confirmedText = document.createTextNode(
    Number(data.latest.confirmed).toLocaleString()
  );
  cUpdateText = document.createTextNode(getDate(data.confirmed.last_updated));
  confirmed.appendChild(confirmedText);
  cUpdate.appendChild(cUpdateText);

  recoveredText = document.createTextNode(
    Number(data.latest.recovered).toLocaleString()
  );
  rUpdateText = document.createTextNode(getDate(data.recovered.last_updated));
  recovered.appendChild(recoveredText);
  rUpdate.appendChild(rUpdateText);

  deathsText = document.createTextNode(
    Number(data.latest.deaths).toLocaleString()
  );
  dUpdateText = document.createTextNode(getDate(data.deaths.last_updated));
  deaths.appendChild(deathsText);
  dUpdate.appendChild(dUpdateText);
};

const getData = async () => {
  const response = await fetch(
    'https://coronavirus-tracker-api.herokuapp.com/all'
  );
  const res = await response.json();

  updateGlobalContainers(res);

  const world = await getWorld();
  createMap(res.confirmed, world);

  //cases for creating map
  rbc.addEventListener('click', getConfirmedData);
  rbd.addEventListener('click', getDeathsData);
  rbr.addEventListener('click', getRecoveredData);

  function getConfirmedData() {
    createMap(res.confirmed, world);
  }

  function getDeathsData() {
    createMap(res.deaths, world);
  }

  function getRecoveredData() {
    createMap(res.recovered, world);
  }
};

getData();
