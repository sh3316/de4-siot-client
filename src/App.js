import React, { useEffect, useState, useCallback } from "react";
import moment from "moment-timezone";
import axios from "axios";
import { Line, Polar } from "react-chartjs-2";
import Colors from "open-color";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";
import "./App.css";

const BASE_URL = "https://chrishuh7.herokuapp.com";
const TZ = "Europe/London";

function App() {
  const [data, setData] = useState({ weathers: [], bikes: [] });
  const [displayData, setDisplayData] = useState(null);
  const [dropdownItems, setDropDownItems] = useState([]);
  const [selectedDropdownItem, setSelectedDropdownItem] = useState({
    label: "All",
    value: null
  });
  const [filteredData, setFilteredData] = useState({ weathers: [], bikes: [] });
  const [weatherClassifiedData, setWeatherClassifiedData] = useState(null);

  useEffect(() => {
    const fetch = async () => {


      const [bikeData, weatherData] = await Promise.all([
        axios.get(`${BASE_URL}/bikes`, {
          params: {
            start_date: "2019-12-21",
            end_date: moment().format("YYYY-MM-DD")
          }
        }),
        axios.get(`${BASE_URL}/weathers`, {
          params: {
            start_date: "2019-12-21",
            end_date: moment().format("YYYY-MM-DD")
          }
        })
      ]);
      const fetchedBikes = Object.values(bikeData.data);
      const fetchedWeathers = Object.values(weatherData.data);

      setDropDownItems(
        fetchedWeathers.reduce(
          (acc, cur) => {
            if (acc.findIndex(item => item.value === cur.weather) === -1) {
              acc.push({ label: cur.weather, value: cur.weather });
            }
            return acc;
          },
          [{ label: "All", value: null }]
        )
      );

      const syncedBikes = fetchedWeathers.map(item => {
        const foundIdx = fetchedBikes.findIndex(
          bike =>
            moment(bike.date).format("YYYY-MM-DD HH:mm") ===
            moment(item.date).format("YYYY-MM-DD HH:mm")
        );
        if (foundIdx !== -1) {
          return fetchedBikes[foundIdx];
        }
        return {
          count: 0,
          date: item.date,
          total: 0,
          data: [],
          timestamp: moment(item.date).format("YYYY-MM-Dd HH:mm")
        };
      });

      setWeatherClassifiedData(
        fetchedWeathers.reduce((acc, cur, idx) => {
          if (acc[cur.weather]) {
            acc[cur.weather].count += syncedBikes[idx].count;
            acc[cur.weather].total += syncedBikes[idx].total;
          } else {
            acc[cur.weather] = {
              count: syncedBikes[idx].count,
              total: syncedBikes[idx].total
            };
          }
          return acc;
        }, {})
      );

      setData({
        bikes: syncedBikes,
        weathers: fetchedWeathers
      });
      setFilteredData({
        bikes: syncedBikes,
        weathers: fetchedWeathers
      });
    };

    fetch(); 
  }, []);

  useEffect(() => {
    if (selectedDropdownItem.value) {
    
      const filteredWeather = data.weathers.reduce(
        (acc, cur, index) => {
          if (cur.weather === selectedDropdownItem.value) {
            acc.weathers.push(cur);
            acc.bikes.push(data.bikes[index]);
          }
          return acc;
        },
        {
          bikes: [],
          weathers: []
        }
      );

      setFilteredData({
        weathers: filteredWeather.weathers,
        bikes: filteredWeather.bikes
      });
    } else {
      setFilteredData({
        weathers: data.weathers,
        bikes: data.bikes
      });
    }
  }, [data.bikes, data.weathers, selectedDropdownItem]);

  useEffect(() => {
    setDisplayData({
      labels: filteredData.weathers.map(item =>
        moment(new Date(item.date))
          .tz(TZ)
          .format("MM-DD HH:mm")
      ),
      datasets: [
        {
          label: "temperature",
          data: filteredData.weathers.map(item => item.temperature),
          fill: false,
          borderColor: Colors.green[7],
          yAxisID: "first-y-axis"
        },
        {
          label: "humidity",
          data: filteredData.weathers.map(item => item.humidity),
          fill: false,
          borderColor: Colors.blue[7],
          yAxisID: "second-y-axis"
        },
        {
          label: "count",
          data: filteredData.bikes.map(item => 1 - (item.count / item.total)),
          borderColor: Colors.red[7],
          yAxisID: "third-y-axis",
          fill: 2
        }
      ]
    });
  }, [filteredData]);

  const handleChangeFilter = useCallback(
    item => setSelectedDropdownItem(item),
    []
  );

  console.log(weatherClassifiedData);

  return (
    <div className="App">
      <Dropdown
        options={dropdownItems}
        onChange={handleChangeFilter}
        value={selectedDropdownItem}
      />
      <Line
        data={displayData}
        options={{
          scales: {
            yAxes: [
              {
                id: "first-y-axis",
                type: "linear",
                position: "right",
                ticks: {
                  suggestedMin: 0,
                  suggestedMax: 20
                }
              },
              {
                id: "second-y-axis",
                type: "linear",
                position: "right",
                ticks: {
                  suggestedMin: 0,
                  suggestedMax: 100
                }
              },
              {
                id: "third-y-axis",
                type: "linear",
                position: "left",
                ticks: {
                  suggestedMin: 0.3,
                  suggestedMax: 1
                }
              }
            ]
          }
        }}
      />
      {weatherClassifiedData && (
        <Polar
          data={{
            labels: dropdownItems.slice(1).map(item => item.value),
            datasets: [
              {
                data: dropdownItems
                  .slice(1)
                  .map(
                    item =>
                      1- (weatherClassifiedData[item.value].count /
                      weatherClassifiedData[item.value].total)
                  ),
                backgroundColor: [
                  Colors.red[5],
                  Colors.blue[5],
                  Colors.green[5],
                  Colors.grape[5],
                  Colors.yellow[5],
                  Colors.orange[5],
                  Colors.lime[5],
                  Colors.pink[5],
                  Colors.green[3],
                  Colors.blue[3],
                ]
              }
            ]
          }}
        />
      )}
    </div>
  );
}

export default App;
