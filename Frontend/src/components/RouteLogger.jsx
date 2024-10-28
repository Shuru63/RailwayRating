import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const RouteLogger = () => {
  const location = useLocation();
  const [visitedRoutes, setVisitedRoutes] = useState([]);

  useEffect(() => {
    const storedRoutes = localStorage.getItem('visitedRoutes');
    if (storedRoutes) {
      const parsedRoutes = JSON.parse(storedRoutes);
      setVisitedRoutes(parsedRoutes);
    }
  }, []);

  useEffect(() => {
    setVisitedRoutes((prevRoutes) => {
      if(location.pathname === prevRoutes[0]){
        return prevRoutes
      }
      const updatedRoutes = [location.pathname, ...prevRoutes].slice(0, 30);
      localStorage.setItem('visitedRoutes', JSON.stringify(updatedRoutes));
      return updatedRoutes;
    });
  }, [location]);

  return null;
  // eslint-disable-next-line no-unreachable
  console.log(visitedRoutes);
};

export default RouteLogger;
