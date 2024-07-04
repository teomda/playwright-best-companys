const { chromium } = require("playwright");
const fs = require("fs");
const { format } = require("date-fns");

const userAgentStrings = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
];

(async () => {
  const browser = await chromium.launch({
    channel: "msedge",
  });

  const context = await browser.newContext({
    userAgent:
      userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)],
  });

  const page = await context.newPage();

  await page.goto(
    "https://www.glassdoor.com.ar/Evaluaciones/index.htm?overall_rating_low=4.5&page=1&sector=10013&filterType=RATING_OVERALL"
  );
  let listTotal = [];
  let anotherPage = true;
  while (anotherPage) {
    const listadoEmpresas = await page.evaluate(() => {
      let dataList = [];
      const empresas = document.querySelectorAll(
        "div.container-max-width.mt-std.mx-auto.px-std.px-md-lg > div > div.row > div.col-md-12.col-lg-8 > div"
      );
      empresas.forEach((item) => {
        const titleElement = item.querySelector(
          "div > div.col-12.col-lg-8.order-0 > div > div > span > h2"
        );

        const scoreElement = item.querySelector(
          "div > div.col-12.col-lg-8.order-0 > div > div > span > div > span > b"
        );

        const locationElement = item.querySelector(
          "div > div > div.col-lg-4.mt-xsm.mt-sm-std.order-2 > span.d-block.mt-0.css-56kyx5"
        );

        const evalElement = item.querySelector(
          "div > div > div.col-12.col-lg-4.mt-lg-0.mt-std.d-flex.justify-content-between.order-6.order-lg-1"
        );

        const industryElemento = item.querySelector(
          "div > div > div.col-lg-4.mt-sm.mt-sm-std.order-4 > span.d-block.mt-0.css-56kyx5"
        );

        if (titleElement) {
          const nombreEmpresa = titleElement.innerText.trim();
          const puntaje = scoreElement.innerText.trim();
          const ubicacion = locationElement.innerText.trim();
          const industria = industryElemento.innerText.trim();
          const evaluaciones = evalElement
            .querySelector("a:nth-child(1) > div > h3")
            .innerText.trim();
          const evaluacionesURL =
            evalElement.querySelector("a:nth-child(1)").href;
          const sueldos = evalElement
            .querySelector("a:nth-child(2) > div > h3")
            .innerText.trim();
          const sueldosURL = evalElement.querySelector("a:nth-child(2)").href;

          const empleos = evalElement
            .querySelector("a:nth-child(3) > div > h3")
            .innerText.trim();
          const empleosURL = evalElement.querySelector("a:nth-child(3)").href;

          dataList.push({
            nombreEmpresa,
            puntaje,
            industria,
            ubicacion,
            evaluaciones,
            evaluacionesURL,
            sueldos,
            sueldosURL,
            empleos,
            empleosURL,
          });
        }
      });
      return dataList;
    });
    listTotal = listTotal.concat(listadoEmpresas);

    anotherPage = await page.evaluate(() => {
      const nextButton = document.querySelector(
        "div.container-max-width.mt-std.mx-auto.px-std.px-md-lg > div > div.row > div.col-md-12.d-flex.justify-content-end.mr-md > div > div > div.pageContainer > button.nextButton.css-opoz2d.e13qs2072"
      );
      if (nextButton && !nextButton.disabled) {
        nextButton.click();
        return true;
      }
      return false;
    });

    if (anotherPage) {
      await page.waitForTimeout(2000);
    }
  }

  await context.close();
  await browser.close();

  const parsePuntaje = (puntaje) => {
    return parseFloat(puntaje.replace(",", "."));
  };

  listTotal.sort((a, b) => parsePuntaje(b.puntaje) - parsePuntaje(a.puntaje));  

  const currentDate = new Date();
  const formattedDate = format(currentDate, "yyyy.MM.dd.HH.mm.ss");
  const fileName = `listado.${formattedDate}.json`;
  fs.writeFileSync(fileName, JSON.stringify(listTotal, null, 2), "utf-8");
  console.log(`Datos guardados en ${fileName}`);
})();
