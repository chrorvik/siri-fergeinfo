document.addEventListener("DOMContentLoaded", function() {
    const fetchFerryInfo = async (direction) => {
      const apiEndpoint = direction === 'MoldeToVestnes' ? 
                          'https://ferge.chrorvik.dev/api/fergekaiz?lat=62.736965&long=7.169330' : 
                          'https://ferge.chrorvik.dev/api/fergekaiz?lat=62.651511&long=7.084845';
  
      try {
            const response = await fetch(apiEndpoint);
            const data = await response.text();
            document.getElementById(`apiResult${direction}`).innerHTML = data;
        } catch (error) {
            console.error("Det oppsto en feil:", error);
            document.getElementById(`apiResult${direction}`).innerHTML = "En feil oppsto. Kunne ikke laste ferge informasjon.";
        }
    };
  
    fetchFerryInfo('MoldeToVestnes');
    fetchFerryInfo('VestnesToMolde');
  });
  