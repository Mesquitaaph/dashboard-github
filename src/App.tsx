import { useEffect, useState } from 'react'
import { Octokit } from 'octokit';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

import { InfoCard } from './Components/InfoCard';
import { GraphContainer } from './Components/GraphContainer';

const octokit = new Octokit({ 
  auth: import.meta.env.REACT_APP_GITHUB_TOKEN
});

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
  languagePercentages: any;
}


function App() {
  const [repo, setRepo] = useState<RepoInfos>();
  const [selectedWeek, setSelectedWeek] = useState<number|undefined>(undefined);

  const getMostFamousRepo = async () => {
    try {
      const resultTemp = await octokit.request("GET /search/repositories?q=stars:>=1&sort=stars&order=desc");
      const mostFamousRepoTemp = resultTemp.data.items[0];

      const result = await octokit.request("GET /repos/{owner}/{repo}/", {
        owner: mostFamousRepoTemp.owner.login,
        repo: mostFamousRepoTemp.name,
      });

      
      const resultCommits = await octokit.request('GET /repos/{owner}/{repo}/stats/commit_activity', {
        owner: mostFamousRepoTemp.owner.login,
        repo: mostFamousRepoTemp.name,
      })
      
      // Guarda a quantidade de commits do repositório nas últimas 52 semanas em um array, da semana mais velha para a mais nova
      const last52Weeks = resultCommits.data

      // Guarda a quantidade de commits nas últimas 4 semanas, da mais velha para a mais nova
      const last4Weeks = last52Weeks.slice(-4)
      

      const resultLanguages = await octokit.request("GET /repos/{owner}/{repo}/languages", {
        owner: mostFamousRepoTemp.owner.login,
        repo: mostFamousRepoTemp.name,
      });
      
      // Obtém a quantidade de bytes de código escrito para cada linguagem encontrada no repositório
      const languageCounts = resultLanguages.data

      // Obtém número total de bytes de código escrito para todas as linguagens
      const languageTotal = Object.values(languageCounts).reduce((accum, value) => accum + value)

      // Calcula a Porcentagem de cada linguagem, em bytes, no repositório
      const languagePercentages = Object.create({})      
      Object.keys(languageCounts).forEach((lang: string) => {
        languagePercentages[lang] = languageCounts[lang]/languageTotal * 100
      });

      const mostFamousRepo: RepoInfos = {
        name: result.data.name,
        stargazers_count: result.data.stargazers_count,
        forks_count: result.data.forks_count,
        watchers: result.data.subscribers_count,
        owner: result.data.owner.login,
        last4WeeksCommits: last4Weeks,
        languagePercentages: languagePercentages
      }

      // console.log(mostFamousRepo)

      setRepo(mostFamousRepo)
      
      return true
    } catch {
      console.log("Error");

      return false;
    }
  };

  const getCommitsWeekChart = (weeks: RepoInfos["last4WeeksCommits"] | undefined) => {
    if(weeks === undefined) return [];

    const data = weeks.map((value, index) => ({name: `Semana ${index+1}`, commits: value.total, index}))

    return data
  };

  const getLanguageChart = (languages: RepoInfos["languagePercentages"] | undefined) => {
    if(languages === undefined) return [];

    const data = Object.keys(languages).map(lang => ({name: lang, Porcentagem: languages[lang].toFixed(3)}))

    return data
  };

  const getCommitsDaysChart = (weeks: RepoInfos["last4WeeksCommits"] | undefined, selectedWeek: number | undefined) => {
    if(weeks === undefined) return [];
    
    const today = new Date()

    const dayInMilliseconds = 24*60*60*1000
    const indexDate = (index:number) => new Date(today.getTime() + (index-21-today.getDay()) * dayInMilliseconds)
    const data = weeks.map(week => week.days).flat().map((commits, index) => ({
      name: `${indexDate(index).getDate()}/${indexDate(index).getMonth()}`, commits: commits, index
    }))

    if (selectedWeek !== undefined) {
      return data.filter((value) => Math.trunc(value.index/7) === selectedWeek)
    }

    return data
  };

  useEffect(() =>{
    getMostFamousRepo()
  }, []);

  return (
    <>
      {/* <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div> */}
      <h1 className="title">Dashboard de {repo?.name}</h1>

      <div className="infosSection">
        <InfoCard title="Estrelas" value={repo?.stargazers_count}/>
        <InfoCard title="Forks" value={repo?.forks_count}/>
        <InfoCard title="Watchers" value={repo?.watchers}/>
      </div>

      <div className="graphsSection">
        <div className="graphsContainer">
          <GraphContainer title="Commits totais nas últimas 4 semanas" style={{width: "50%"}}>
            <ResponsiveContainer width={"100%"} height={400}>
              <BarChart 
                data={getCommitsWeekChart(repo?.last4WeeksCommits)}
                margin={{
                  top: 5,
                  right: 8,
                  left: -36,
                  bottom: 40,
                }}
                barGap={5}
                barSize={'10%'}
                onMouseLeave={() => setSelectedWeek(undefined)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" style={{fill: 'white'}}/>
                <YAxis style={{fill: 'white'}}/>
                <Tooltip wrapperStyle={{color:'black'}} itemStyle={{color:'black'}}/>
                <Bar dataKey="commits" stroke="white" onMouseEnter={(e) => setSelectedWeek(e.payload.index)}/>
              </BarChart>
            </ResponsiveContainer>
          </GraphContainer>
          
          <GraphContainer title={selectedWeek === undefined ? "Commits nos dias das últimas 4 semanas" : `Commits nos dias da semana ${selectedWeek+1}`}>
            <ResponsiveContainer width={"100%"} height={400}>
              <LineChart
                data={getCommitsDaysChart(repo?.last4WeeksCommits, selectedWeek)}
                margin={{
                  top: 5,
                  right: 9,
                  left: 0,
                  bottom: 40,
                }}
                >
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="name" angle={45} tickMargin={16} style={{fill: 'white'}}/>
                <YAxis style={{fill: 'white'}}/>
                <Tooltip wrapperStyle={{color:'black'}} itemStyle={{color:'black'}}/>
                <Line dataKey="commits" stroke="white" />
              </LineChart>
            </ResponsiveContainer>
          </GraphContainer>
        </div>
        <div className="graphsContainer">
          <GraphContainer title="Porcentagem de cada linguagem encontrada no repositório">
            <ResponsiveContainer width={"40%"} height={400}>
              <BarChart 
                data={getLanguageChart(repo?.languagePercentages)}
                margin={{
                  top: 5,
                  right: 40,
                  left: 0,
                  bottom: 40,
                }}
                barGap={5}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={45} tickMargin={24} style={{fill: 'white'}}/>
                <YAxis scale="sqrt" style={{fill: 'white'}}/>
                <Tooltip wrapperStyle={{color:'black'}} itemStyle={{color:'black'}} formatter={(value) => `${value}%`}/>
                <Bar dataKey="Porcentagem" stroke="#aaaaaa" fill="#242424" strokeWidth={1}/>
              </BarChart>
            </ResponsiveContainer>
          </GraphContainer>
          </div>
      </div>
    </>
  )
}

export default App;