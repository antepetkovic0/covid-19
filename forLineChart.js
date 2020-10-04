const firstSelect = document.getElementById('first_select');
document.getElementById('add').addEventListener('click', addSelect);
document.getElementById('show').addEventListener('click', createChart);

const rbc = document.getElementById('rb_c');
const rbd = document.getElementById('rb_d');
const rbr = document.getElementById('rb_r');
const infoContainer = document.getElementById('infos');

async function createChart() {
  const response = await fetch(
    'https://coronavirus-tracker-api.herokuapp.com/all'
  );
  const res = await response.json();
  infoContainer.style.visibility = 'visible';

  let w = document.getElementById('second').clientWidth;
  let h = document.getElementById('second').clientHeight;

  const margin = { top: 30, right: 150, bottom: 30, left: 50 };
  const width = w - margin.left - margin.right;
  const height = h - margin.top - margin.bottom;

  const containerWidth = width + margin.left + margin.right;
  const containerHeight = height + margin.top + margin.bottom;

  // Setup ranges
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  d3.select('#second')
    .select('svg')
    .remove();

  const svg = d3
    .select('#second')
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  //get array of selected country names
  let countries = [];
  const allSelects = document.getElementsByClassName('cx');
  for (item of allSelects) {
    let cname = item.options[item.selectedIndex].value;
    countries.push(cname);
  }
  //console.log(countries);

  //get max date and number of cases for chart
  let maxDate = null;
  let maxCount = null;

  const newCountry = countries.map(country => {
    let cData;
    if (rbc.checked) {
      //get history object of filtered countries
      const c = res.confirmed.locations.find(
        d => d.country === country && !d.province
      ).history;
      cData = c;
    } else if (rbr.checked) {
      //get history object of filtered countries
      const c = res.recovered.locations.find(
        d => d.country === country && !d.province
      ).history;
      cData = c;
    } else if (rbd.checked) {
      //get history object of filtered countries
      const c = res.deaths.locations.find(
        d => d.country === country && !d.province
      ).history;
      cData = c;
    } else {
      alert('You must select specific case');
    }

    //history => {date: number, date: number,...}
    const data = Object.keys(cData).map(key => {
      //console.log(cData[k]);
      const date = d3.timeParse('%m/%d/%y')(key);
      const count = +cData[key];
      if (!maxDate || maxDate < date) {
        maxDate = date;
      }
      if (!maxCount || maxCount < count) {
        maxCount = count;
      }
      return { date, count };
    });
    return { country, data };
  });
  const chartData = { maxDate, maxCount, newCountry };
  //console.log(chartData);

  x.domain(
    d3.extent(chartData.newCountry[0].data, function(d) {
      return d.date;
    })
  );
  y.domain([0, chartData.maxCount]);

  // Add line for each country
  for (let i = 0; i < chartData.newCountry.length; i++) {
    const countryData = chartData.newCountry[i].data;
    // console.log(
    //   chartData.newCountry[i].data[chartData.newCountry[i].data.length - 1]
    //     .count
    // );

    // Build the line
    const line = d3
      .line()
      .x(function(d) {
        return x(d.date);
      })
      .y(function(d) {
        return y(d.count);
      });

    // Add the line to the chart
    svg
      .append('path')
      .data([countryData])
      .attr('class', 'line')
      .attr('d', line)
      .style('color', 'red');

    //add circles
    svg
      .selectAll('dot')
      .data(countryData)
      .enter()
      .append('circle')
      .attr('r', 3)
      .attr('cx', function(d) {
        return x(d.date);
      })
      .attr('cy', function(d) {
        return y(d.count);
      })
      .style('opacity', 1)
      //.on('mouseover', d => d3.select(this).attr('r', 8))
      .on('mouseover', d => {
        d3.select('#info')
          .append('text')
          .attr('id', 'info_text')
          .text(`${d.date} - ${d.count}`);
        // svg
        //   .selectAll('dot')
        //   .attr('r', 5)
        //   .style('opacity', 1);
      })
      .on('mouseout', d => {
        d3.select('#info_text').remove();
      });

    // Add legend
    svg
      .append('text')
      .attr(
        'transform',
        'translate(' +
          (width + 3) +
          ',' +
          y(countryData[countryData.length - 1].count) +
          ')'
      )
      .text(
        `${chartData.newCountry[i].country} - ${
          chartData.newCountry[i].data[chartData.newCountry[i].data.length - 1]
            .count
        }`
      );
  }
  svg
    .append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x));

  // Add the y axis
  svg
    .append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('dy', '.75em')
    .attr('y', 6)
    .style('text-anchor', 'end')
    .text('Number of cases');
}

function addSelect() {
  const div = document.getElementById('first');
  const select = document.createElement('select');
  select.className = 'cx';
  div.appendChild(select);
  getData(select);
}

const getData = async selectTag => {
  const response = await fetch(
    'https://coronavirus-tracker-api.herokuapp.com/all'
  );
  const res = await response.json();

  let selectOptions = '';

  //filter countries without provinces data
  const countries = res.confirmed.locations
    .filter(l => !l.province)
    .map(l => l.country)
    .sort((a, b) => a.localeCompare(b));
  //console.log(countries);
  // //[{country:"",country_code:"",latest:},{}...]

  countries.forEach(c => {
    selectOptions += '<option value="' + c + '">' + c + '</option>';
  });
  selectTag.innerHTML = selectOptions;
};

getData(firstSelect);
