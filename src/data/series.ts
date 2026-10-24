// Champions per series: "year|name|team". nat = home country, wiki = Wikipedia titles that differ from the name.
// era: seasons from era[0] on are easy, from era[1] medium, older hard.
interface SeriesRaw {
  era: [number, number];
  team: string;
  champ: (year: number) => string;
  wiki?: Record<string, string>;
  nat: Record<string, string>;
  list: string;
}
export interface Champion { y: number; name: string; team: string }
export type Series = Omit<SeriesRaw, 'list'> & { list: Champion[] };

const RAW: Record<string, SeriesRaw> = {
  'Formula 1': {era: [1990, 1970], team: 'team', champ: () => 'Formula 1 World Championship',
    wiki: {'Giuseppe Farina': 'Nino Farina', 'Alan Jones': 'Alan Jones (racing driver)'},
    nat: {'Giuseppe Farina': 'Italy', 'Juan Manuel Fangio': 'Argentina', 'Alberto Ascari': 'Italy', 'Mike Hawthorn': 'United Kingdom', 'Jack Brabham': 'Australia',
      'Phil Hill': 'USA', 'Graham Hill': 'United Kingdom', 'Jim Clark': 'United Kingdom', 'John Surtees': 'United Kingdom', 'Denny Hulme': 'New Zealand',
      'Jackie Stewart': 'United Kingdom', 'Jochen Rindt': 'Austria', 'Emerson Fittipaldi': 'Brazil', 'Niki Lauda': 'Austria', 'James Hunt': 'United Kingdom',
      'Mario Andretti': 'USA', 'Jody Scheckter': 'South Africa', 'Alan Jones': 'Australia', 'Nelson Piquet': 'Brazil', 'Keke Rosberg': 'Finland',
      'Alain Prost': 'France', 'Ayrton Senna': 'Brazil', 'Nigel Mansell': 'United Kingdom', 'Michael Schumacher': 'Germany', 'Damon Hill': 'United Kingdom',
      'Jacques Villeneuve': 'Canada', 'Mika Häkkinen': 'Finland', 'Fernando Alonso': 'Spain', 'Kimi Räikkönen': 'Finland', 'Lewis Hamilton': 'United Kingdom',
      'Jenson Button': 'United Kingdom', 'Sebastian Vettel': 'Germany', 'Nico Rosberg': 'Germany', 'Max Verstappen': 'Netherlands', 'Lando Norris': 'United Kingdom'},
    list: `1950|Giuseppe Farina|Alfa Romeo
1951|Juan Manuel Fangio|Alfa Romeo
1952|Alberto Ascari|Ferrari
1953|Alberto Ascari|Ferrari
1954|Juan Manuel Fangio|Maserati & Mercedes
1955|Juan Manuel Fangio|Mercedes
1956|Juan Manuel Fangio|Ferrari
1957|Juan Manuel Fangio|Maserati
1958|Mike Hawthorn|Ferrari
1959|Jack Brabham|Cooper
1960|Jack Brabham|Cooper
1961|Phil Hill|Ferrari
1962|Graham Hill|BRM
1963|Jim Clark|Lotus
1964|John Surtees|Ferrari
1965|Jim Clark|Lotus
1966|Jack Brabham|Brabham
1967|Denny Hulme|Brabham
1968|Graham Hill|Lotus
1969|Jackie Stewart|Matra
1970|Jochen Rindt|Lotus
1971|Jackie Stewart|Tyrrell
1972|Emerson Fittipaldi|Lotus
1973|Jackie Stewart|Tyrrell
1974|Emerson Fittipaldi|McLaren
1975|Niki Lauda|Ferrari
1976|James Hunt|McLaren
1977|Niki Lauda|Ferrari
1978|Mario Andretti|Lotus
1979|Jody Scheckter|Ferrari
1980|Alan Jones|Williams
1981|Nelson Piquet|Brabham
1982|Keke Rosberg|Williams
1983|Nelson Piquet|Brabham
1984|Niki Lauda|McLaren
1985|Alain Prost|McLaren
1986|Alain Prost|McLaren
1987|Nelson Piquet|Williams
1988|Ayrton Senna|McLaren
1989|Alain Prost|McLaren
1990|Ayrton Senna|McLaren
1991|Ayrton Senna|McLaren
1992|Nigel Mansell|Williams
1993|Alain Prost|Williams
1994|Michael Schumacher|Benetton
1995|Michael Schumacher|Benetton
1996|Damon Hill|Williams
1997|Jacques Villeneuve|Williams
1998|Mika Häkkinen|McLaren
1999|Mika Häkkinen|McLaren
2000|Michael Schumacher|Ferrari
2001|Michael Schumacher|Ferrari
2002|Michael Schumacher|Ferrari
2003|Michael Schumacher|Ferrari
2004|Michael Schumacher|Ferrari
2005|Fernando Alonso|Renault
2006|Fernando Alonso|Renault
2007|Kimi Räikkönen|Ferrari
2008|Lewis Hamilton|McLaren
2009|Jenson Button|Brawn
2010|Sebastian Vettel|Red Bull
2011|Sebastian Vettel|Red Bull
2012|Sebastian Vettel|Red Bull
2013|Sebastian Vettel|Red Bull
2014|Lewis Hamilton|Mercedes
2015|Lewis Hamilton|Mercedes
2016|Nico Rosberg|Mercedes
2017|Lewis Hamilton|Mercedes
2018|Lewis Hamilton|Mercedes
2019|Lewis Hamilton|Mercedes
2020|Lewis Hamilton|Mercedes
2021|Max Verstappen|Red Bull
2022|Max Verstappen|Red Bull
2023|Max Verstappen|Red Bull
2024|Max Verstappen|Red Bull
2025|Lando Norris|McLaren`},
  Rally: {era: [2000, 1990], team: 'manufacturer', champ: () => 'World Rally Championship drivers\' title',
    wiki: {'Carlos Sainz': 'Carlos Sainz Sr.'},
    nat: {'Björn Waldegård': 'Sweden', 'Walter Röhrl': 'Germany', 'Ari Vatanen': 'Finland', 'Hannu Mikkola': 'Finland', 'Stig Blomqvist': 'Sweden',
      'Timo Salonen': 'Finland', 'Juha Kankkunen': 'Finland', 'Miki Biasion': 'Italy', 'Carlos Sainz': 'Spain', 'Didier Auriol': 'France',
      'Colin McRae': 'United Kingdom', 'Tommi Mäkinen': 'Finland', 'Marcus Grönholm': 'Finland', 'Richard Burns': 'United Kingdom', 'Petter Solberg': 'Norway',
      'Sébastien Loeb': 'France', 'Sébastien Ogier': 'France', 'Ott Tänak': 'Estonia', 'Kalle Rovanperä': 'Finland', 'Thierry Neuville': 'Belgium'},
    list: `1979|Björn Waldegård|Ford
1980|Walter Röhrl|Fiat
1981|Ari Vatanen|Ford
1982|Walter Röhrl|Opel
1983|Hannu Mikkola|Audi
1984|Stig Blomqvist|Audi
1985|Timo Salonen|Peugeot
1986|Juha Kankkunen|Peugeot
1987|Juha Kankkunen|Lancia
1988|Miki Biasion|Lancia
1989|Miki Biasion|Lancia
1990|Carlos Sainz|Toyota
1991|Juha Kankkunen|Lancia
1992|Carlos Sainz|Toyota
1993|Juha Kankkunen|Toyota
1994|Didier Auriol|Toyota
1995|Colin McRae|Subaru
1996|Tommi Mäkinen|Mitsubishi
1997|Tommi Mäkinen|Mitsubishi
1998|Tommi Mäkinen|Mitsubishi
1999|Tommi Mäkinen|Mitsubishi
2000|Marcus Grönholm|Peugeot
2001|Richard Burns|Subaru
2002|Marcus Grönholm|Peugeot
2003|Petter Solberg|Subaru
2004|Sébastien Loeb|Citroën
2005|Sébastien Loeb|Citroën
2006|Sébastien Loeb|Citroën
2007|Sébastien Loeb|Citroën
2008|Sébastien Loeb|Citroën
2009|Sébastien Loeb|Citroën
2010|Sébastien Loeb|Citroën
2011|Sébastien Loeb|Citroën
2012|Sébastien Loeb|Citroën
2013|Sébastien Ogier|Volkswagen
2014|Sébastien Ogier|Volkswagen
2015|Sébastien Ogier|Volkswagen
2016|Sébastien Ogier|Volkswagen
2017|Sébastien Ogier|Ford
2018|Sébastien Ogier|Ford
2019|Ott Tänak|Toyota
2020|Sébastien Ogier|Toyota
2021|Sébastien Ogier|Toyota
2022|Kalle Rovanperä|Toyota
2023|Kalle Rovanperä|Toyota
2024|Thierry Neuville|Hyundai
2025|Sébastien Ogier|Toyota`},
  MotoGP: {era: [1990, 1970], team: 'manufacturer', champ: y => (y < 2002 ? '500cc' : 'MotoGP') + ' World Championship',
    wiki: {'Les Graham': 'Les Graham (motorcycle racer)'},
    nat: {'Les Graham': 'United Kingdom', 'Umberto Masetti': 'Italy', 'Geoff Duke': 'United Kingdom', 'John Surtees': 'United Kingdom', 'Libero Liberati': 'Italy',
      'Gary Hocking': 'Rhodesia', 'Mike Hailwood': 'United Kingdom', 'Giacomo Agostini': 'Italy', 'Phil Read': 'United Kingdom', 'Barry Sheene': 'United Kingdom',
      'Kenny Roberts': 'USA', 'Marco Lucchinelli': 'Italy', 'Franco Uncini': 'Italy', 'Freddie Spencer': 'USA', 'Eddie Lawson': 'USA', 'Wayne Gardner': 'Australia',
      'Wayne Rainey': 'USA', 'Kevin Schwantz': 'USA', 'Mick Doohan': 'Australia', 'Àlex Crivillé': 'Spain', 'Kenny Roberts Jr.': 'USA', 'Valentino Rossi': 'Italy',
      'Nicky Hayden': 'USA', 'Casey Stoner': 'Australia', 'Jorge Lorenzo': 'Spain', 'Marc Márquez': 'Spain', 'Joan Mir': 'Spain', 'Fabio Quartararo': 'France',
      'Francesco Bagnaia': 'Italy', 'Jorge Martín': 'Spain'},
    list: `1949|Les Graham|AJS
1950|Umberto Masetti|Gilera
1951|Geoff Duke|Norton
1952|Umberto Masetti|Gilera
1953|Geoff Duke|Gilera
1954|Geoff Duke|Gilera
1955|Geoff Duke|Gilera
1956|John Surtees|MV Agusta
1957|Libero Liberati|Gilera
1958|John Surtees|MV Agusta
1959|John Surtees|MV Agusta
1960|John Surtees|MV Agusta
1961|Gary Hocking|MV Agusta
1962|Mike Hailwood|MV Agusta
1963|Mike Hailwood|MV Agusta
1964|Mike Hailwood|MV Agusta
1965|Mike Hailwood|MV Agusta
1966|Giacomo Agostini|MV Agusta
1967|Giacomo Agostini|MV Agusta
1968|Giacomo Agostini|MV Agusta
1969|Giacomo Agostini|MV Agusta
1970|Giacomo Agostini|MV Agusta
1971|Giacomo Agostini|MV Agusta
1972|Giacomo Agostini|MV Agusta
1973|Phil Read|MV Agusta
1974|Phil Read|MV Agusta
1975|Giacomo Agostini|Yamaha
1976|Barry Sheene|Suzuki
1977|Barry Sheene|Suzuki
1978|Kenny Roberts|Yamaha
1979|Kenny Roberts|Yamaha
1980|Kenny Roberts|Yamaha
1981|Marco Lucchinelli|Suzuki
1982|Franco Uncini|Suzuki
1983|Freddie Spencer|Honda
1984|Eddie Lawson|Yamaha
1985|Freddie Spencer|Honda
1986|Eddie Lawson|Yamaha
1987|Wayne Gardner|Honda
1988|Eddie Lawson|Yamaha
1989|Eddie Lawson|Honda
1990|Wayne Rainey|Yamaha
1991|Wayne Rainey|Yamaha
1992|Wayne Rainey|Yamaha
1993|Kevin Schwantz|Suzuki
1994|Mick Doohan|Honda
1995|Mick Doohan|Honda
1996|Mick Doohan|Honda
1997|Mick Doohan|Honda
1998|Mick Doohan|Honda
1999|Àlex Crivillé|Honda
2000|Kenny Roberts Jr.|Suzuki
2001|Valentino Rossi|Honda
2002|Valentino Rossi|Honda
2003|Valentino Rossi|Honda
2004|Valentino Rossi|Yamaha
2005|Valentino Rossi|Yamaha
2006|Nicky Hayden|Honda
2007|Casey Stoner|Ducati
2008|Valentino Rossi|Yamaha
2009|Valentino Rossi|Yamaha
2010|Jorge Lorenzo|Yamaha
2011|Casey Stoner|Honda
2012|Jorge Lorenzo|Yamaha
2013|Marc Márquez|Honda
2014|Marc Márquez|Honda
2015|Jorge Lorenzo|Yamaha
2016|Marc Márquez|Honda
2017|Marc Márquez|Honda
2018|Marc Márquez|Honda
2019|Marc Márquez|Honda
2020|Joan Mir|Suzuki
2021|Fabio Quartararo|Yamaha
2022|Francesco Bagnaia|Ducati
2023|Francesco Bagnaia|Ducati
2024|Jorge Martín|Ducati
2025|Marc Márquez|Ducati`}
};

export const SERIES: Record<string, Series> = Object.fromEntries(Object.entries(RAW).map(([key, s]) => [key, {
  ...s,
  list: s.list.split('\n').map(line => { const [y, name, team] = line.split('|'); return {y: +y, name, team}; }),
}]));
