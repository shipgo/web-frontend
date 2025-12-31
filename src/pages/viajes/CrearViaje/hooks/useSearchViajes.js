import { useQuery } from "@tanstack/react-query";

const useSearchViajes = () => {
  const [viajes, setViajes] = useState([]);

  return { viajes, setViajes };
};

export default useSearchViajes;
