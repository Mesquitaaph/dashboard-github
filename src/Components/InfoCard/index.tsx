import './style.css'

interface InfoCardProps {
  title: string;
  value?: number;
}

export const InfoCard = ({title, value}: InfoCardProps) => {
  return (
    <div className="infoCard">
      <span className="infoCardTitle">{title}:</span>
      <span className="infoCardValue">{value?.toLocaleString()}</span>
    </div>
  )
};