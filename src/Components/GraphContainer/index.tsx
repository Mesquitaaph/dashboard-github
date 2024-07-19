import "./style.css";

interface GraphContainerProps {
  title: string;
  style?: any;
  children: any;
}

export const GraphContainer = ({title, style, children}: GraphContainerProps) => {
  return (
    <div className="chartContainer" style={style}>
      <span className="chartTitle">{title}</span>
      { children }
    </div>
  );
};