import { useState } from 'react';
import { Chart } from 'react-google-charts';

export const barOptions = {
  chart: {
    title: "Commits nas últimas 4 semanas",
    // legend: { position: "bottom" },
  },
  chartArea: { backgroundColor: '#f1f7f9' }
};

export const lineChartOptions = {
  title: "Commits nas últimas 4 semanas",
  legend: { position: "bottom" },
};

interface RepoInfos {
  name: string;
  stargazers_count: number;
  forks_count: number;
  watchers: number;
  owner: any;
  last4WeeksCommits: {
    days: number[];
    total: number;
    week: number;
  }[];
  languagePercentages: Object;
}

export const GoogleCharts = () => {
  const [repo, setRepo] = useState<RepoInfos>();

  const getCommitsWeekChart = (weeks: RepoInfos["last4WeeksCommits"] | undefined) => {
    if(weeks === undefined) return [];
    // console.log(weeks)
    const header = [["Semana", "Commits"]]
    const data = weeks.map((value, index) => [`Semana ${index+1}`, value.total])

    const dataChart = [...header, ...data]

    return dataChart
  };

  const getCommitsDaysChart = (weeks: RepoInfos["last4WeeksCommits"] | undefined) => {
    if(weeks === undefined) return [];

    const header = [["Dia", "Commits"]]
    
    const data = weeks.map(week => week.days).flat().map((commits, index) => [`Dia ${index+1}`, commits])

    console.log(data)

    const dataChart = [...header, ...data]

    return dataChart
  };


  return <>
    <Chart
      chartType="Bar"
      width="75%"
      height="400px"
      data={getCommitsWeekChart(repo?.last4WeeksCommits)}
      // options={{backgroundColor: '#242424'}}
      options={barOptions}
      style={{margin: '0 auto'}}
    />
    <Chart
      width="75%"
      chartType="LineChart"
      height="400px"
      data={getCommitsDaysChart(repo?.last4WeeksCommits)}
      options={lineChartOptions}
      style={{margin: '0 auto'}}
    />
  </>
}