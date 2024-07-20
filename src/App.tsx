import { useEffect, useState } from 'react'
import { Octokit } from 'octokit';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import githubLogo from './assets/github.svg';

import './App.css'

import { InfoCard } from './Components/InfoCard';
import { GraphContainer } from './Components/GraphContainer';

const octokit = new Octokit({ 
  auth: import.meta.env.REACT_APP_GITHUB_TOKEN
});

interface RepoInfos {
  name: string;
  html_url: string;
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
        html_url: result.data.html_url,
        stargazers_count: result.data.stargazers_count,
        forks_count: result.data.forks_count,
        watchers: result.data.subscribers_count,
        owner: result.data.owner.login,
        last4WeeksCommits: last4Weeks,
        languagePercentages: languagePercentages
      }

      setRepo(mostFamousRepo)
      
      return true
    } catch {
      console.log("Erro! ");

      return false;
    }
  };

  // Retorna os dados dos commits nas últimas 4 semanas no formato do recharts.
  const getCommitsWeekChart = (weeks: RepoInfos["last4WeeksCommits"] | undefined) => {
    if(weeks === undefined) return [];

    const data = weeks.map((value, index) => ({name: `Semana ${index+1}`, commits: value.total, index}))

    return data
  };

  // Retorna os dados dos commits nos dias das últimas 4 semanas no formato do recharts.
  // Caso um semana seja selecionada, retorna apenas os seus dias
  const getCommitsDaysChart = (weeks: RepoInfos["last4WeeksCommits"] | undefined, selectedWeek: number | undefined) => {
    if(weeks === undefined) return [];
    
    const today = new Date()

    const dayInMilliseconds = 24*60*60*1000

    // Guarda cada um dos dias das semanas em um array, em ordem cronológica
    const days = weeks.map(week => week.days).flat()
    
    // Retorna a data relacionada ao índice da lista de dias
    // Sabendo que são 4 semanas, 28 dias, posso encontrar os commits do dia de hoje com o today.getDay()
    // considerando apenas os dias da última semana. Assim, trato hoje como o dia 0 e dias antes e depois como negativos e positivos, respectivamente.
    // Após isso, basta somar o número de dias na data de hoje (dia -1 encontra a data de ontem, dia 1 encontra a data de amanhã)
    const indexDate = (index:number) => new Date(today.getTime() + (index-21-today.getDay()) * dayInMilliseconds)

    const data = days.map((commits, index) => ({
      name: `${indexDate(index).getDate()}/${indexDate(index).getMonth()+1}`, commits: commits, index
    }))

    if (selectedWeek !== undefined) {
      return data.filter((value) => Math.trunc(value.index/7) === selectedWeek)
    }

    return data
  };

  // Retorna as porcentagens das linguagens encontradas no repositório no formato do recharts.
  const getLanguageChart = (languages: RepoInfos["languagePercentages"] | undefined) => {
    if(languages === undefined) return [];

    const data = Object.keys(languages).map(lang => ({name: lang, Porcentagem: languages[lang].toFixed(3)}))

    return data
  };

  useEffect(() =>{
    getMostFamousRepo()
  }, []);

  if(repo === undefined) {
    return (
      <div className="loadingScreen">
        <img src={githubLogo} className="loadingLogo" alt="Github logo"/>
      </div>
    )
  }

  return (
    <>
      <h1 className="title">Dashboard de <a href={repo?.html_url} target="_blank">{repo?.name}</a></h1>

      <div className="infosSection">
        <InfoCard title="Stars" value={repo?.stargazers_count}/>
        <InfoCard title="Forks" value={repo?.forks_count}/>
        <InfoCard title="Watchers" value={repo?.watchers}/>
      </div>

      <div className="graphsSection">
        <div className="graphsContainer">
          <GraphContainer title="Commits totais nas últimas 4 semanas" style={{ width: "30%", minWidth: "150px" }}>
            <ResponsiveContainer width={"100%"} height={400}>
              <BarChart 
                data={getCommitsWeekChart(repo?.last4WeeksCommits)}
                margin={{
                  top: 5,
                  right: 8,
                  left: -24,
                  bottom: 40,
                }}
                barGap={5}
                barSize={'10%'}
                onMouseLeave={() => setSelectedWeek(undefined)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={45} tickMargin={24} style={{fill: 'white'}}/>
                <YAxis style={{fill: 'white'}}/>
                <Tooltip wrapperStyle={{color:'black'}} itemStyle={{color:'black'}}/>
                <Bar dataKey="commits" stroke="#465DDE" strokeWidth={2} fill="#242424" onMouseEnter={(e) => setSelectedWeek(e.payload.index)}/>
              </BarChart>
            </ResponsiveContainer>
          </GraphContainer>
          
          <GraphContainer 
            title={selectedWeek === undefined ? "Commits nos dias das últimas 4 semanas" : `Commits nos dias da semana ${selectedWeek+1}`} 
            style={{ width: "70%", minWidth: "250px" }}
          >
            <ResponsiveContainer width={"100%"} height={400}>
              <LineChart
                data={getCommitsDaysChart(repo?.last4WeeksCommits, selectedWeek)}
                margin={{
                  top: 5,
                  right: 9,
                  left: -24,
                  bottom: 40,
                }}
                >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={45} tickMargin={16} style={{fill: 'white'}}/>
                <YAxis style={{fill: 'white'}}/>
                <Tooltip wrapperStyle={{color:'black'}} itemStyle={{color:'black'}}/>
                <Line dataKey="commits" stroke="#465DDE" strokeWidth={2}/>
              </LineChart>
            </ResponsiveContainer>
          </GraphContainer>
        </div>
        <div className="graphsContainer">
          <GraphContainer title="Porcentagem de cada linguagem encontrada no repositório">
            <ResponsiveContainer width={"100%"} height={400}>
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
                <Bar dataKey="Porcentagem" stroke="#36904A" strokeWidth={2} fill="#242424" />
              </BarChart>
            </ResponsiveContainer>
          </GraphContainer>
          </div>
      </div>
    </>
  )
}

export default App;