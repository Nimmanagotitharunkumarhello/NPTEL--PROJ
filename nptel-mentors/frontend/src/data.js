export const fetchData = async () => {
    const url = "https://openai80.p.rapidapi.com/models";
    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "8b0a905d65msh006cf8356da27ecp14532bjsn91a76b81e7b2",
        "X-RapidAPI-Host": "openai80.p.rapidapi.com",
      },
    };
  
    try {
      const response = await fetch(url, options);
      const result = await response.text();
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };