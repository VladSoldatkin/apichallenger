import { test, expect } from "@playwright/test";

test.describe("API @Challenge", () => {
  const URL = "https://apichallenges.herokuapp.com/";
  let token;
  //Test#1 - POST /challenger (201)(get user_token))
  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${URL}challenger`);
    const headers = response.headers();
    token = headers["x-challenger"];
    console.log("Токен пользователя -> " + token);
  });

  test(
    "Test#2 - GET /challenges (200)",
    { tag: "@get" },
    async ({ request }) => {
      let response = await request.get(`${URL}challenges`, {
        headers: {
          "x-challenger": token,
        },
      });
      const headers = response.headers();
      let body = await response.json();
      expect(response.status()).toBe(200);
      expect(headers).toEqual(
        expect.objectContaining({ "x-challenger": token })
      );
    }
  );

  test("Test#3 - GET/todos (200)", { tag: "@get" }, async ({ request }) => {
    let response = await request.get(`${URL}todos`, {
      headers: {
        "x-challenger": token,
      },
    });
    const headers = response.headers();
    let body = await response.json();
    expect(response.status()).toBe(200);
    expect(headers).toEqual(expect.objectContaining({ "x-challenger": token }));
    console.log(token);
    expect(Array.isArray(body.todos)).toBeTruthy();
  });

  test(
    "Test#4 - GET/todo (expect eror code 404)",
    { tag: "@get" },
    async ({ request }) => {
      let response = await request.get(`${URL}todo`, {
        headers: {
          "x-challenger": token,
        },
      });
      const headers = response.headers();
      expect(response.status()).toBe(404);
      expect(headers).toEqual(
        expect.objectContaining({ "x-challenger": token })
      );
    }
  );

  test(
    "Test#5 - GET /todos/{id} (200)",
    { tag: "@get" },
    async ({ request }) => {
      // Метод создания объекта, чтобы вытащить id для теста
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: { title: "New Object", doneStatus: false, description: "Get ID" },
      });
      let newObject = await createObject.json();
      const objectId = newObject.id;
      //Выполнение теста с полученным id
      const response = await request.get(`${URL}todos/${objectId}`, {
        headers: {
          "x-challenger": token,
        },
      });
      expect(response.status()).toBe(200);
      expect(
        await response.json({
          todos: [
            {
              id: objectId,
              title: "New Object",
              doneStatus: false,
              description: "Get ID",
            },
          ],
        })
      );
    }
  );

  test(
    "Test#6 - GET /todos/{id} (404)",
    { tag: "@get" },
    async ({ request }) => {
      let wrongId = 88888;
      const response = await request.get(`${URL}todos/${wrongId}`, {
        headers: { "x-challenger": token },
      });
      const headers = response.headers();
      expect(response.status()).toBe(404);
    }
  );

  test(
    "Test#7 - GET /todos (200) ?filter",
    { tag: "@get" },
    async ({ request }) => {
      //создание сущности с doneStatus=true;
      let doneStatusTrue = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: { title: "Create true", doneStatus: true },
      });
      //создание сущности с doneStatus=false;
      let doneStatusFalse = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: { title: "Create false", doneStatus: false },
      });
      //проверка выдачи списка todos с doneStatus=true
      const statusTrue = "?doneStatus=true";
      const responseTrue = await request.get(`${URL}todos${statusTrue}`, {
        headers: { "x-challenger": token },
      });
      const arrayWithTrue = responseTrue.json();
      expect(responseTrue.status()).toBe(200);
      //проверка выдачи списка todos с doneStatus=true
      const statusFalse = "?doneStatus=false";
      const responseFalse = await request.get(`${URL}todos${statusFalse}`, {
        headers: { "x-challenger": token },
      });
      expect(responseFalse.status()).toBe(200);
    }
  );

  test("Test#8 - HEAD /todos (200)", { tag: "@head" }, async ({ request }) => {
    let response = await request.head(`${URL}todos`, {
      headers: {
        "x-challenger": token,
      },
    });
    const headers = response.headers();
    expect(response.status()).toBe(200);
    expect(headers).toEqual(expect.objectContaining({ "x-challenger": token }));
  });

  test("Test#9 - POST /todos (201)", { tag: "@post" }, async ({ request }) => {
    const createObject = await request.post(`${URL}todos`, {
      headers: { "x-challenger": token, "Content-Type": "application/json" },
      data: { title: "New Object", doneStatus: false, description: "Get ID" },
    });
    expect(createObject.status()).toBe(201);
  });

  test(
    "Test#10 - POST /todos (400) doneStatus",
    { tag: "@post" },
    async ({ request }) => {
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: {
          title: "New Object",
          doneStatus: "invalid",
          description: "Get ID",
        },
      });
      let errorMessage = await createObject.json();
      expect(createObject.status()).toBe(400);
      expect(errorMessage).toEqual(
        expect.objectContaining({
          errorMessages: [
            "Failed Validation: doneStatus should be BOOLEAN but was STRING",
          ],
        })
      );
    }
  );

  test(
    "Test#11 - POST /todos (400) title too long",
    { tag: "@post" },
    async ({ request }) => {
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: {
          title: "t".repeat(51),
          doneStatus: false,
          description: "d".repeat(200),
        },
      });
      let errorMessage = await createObject.json();
      expect(createObject.status()).toBe(400);
      expect(errorMessage).toEqual(
        expect.objectContaining({
          errorMessages: [
            "Failed Validation: Maximum allowable length exceeded for title - maximum allowed is 50",
          ],
        })
      );
    }
  );

  test(
    "Test#12 - POST /todos (400) description too long",
    { tag: "@post" },
    async ({ request }) => {
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: {
          title: "t".repeat(50),
          doneStatus: false,
          description: "d".repeat(201),
        },
      });
      let errorMessage = await createObject.json();
      expect(createObject.status()).toBe(400);
      expect(errorMessage).toEqual(
        expect.objectContaining({
          errorMessages: [
            "Failed Validation: Maximum allowable length exceeded for description - maximum allowed is 200",
          ],
        })
      );
    }
  );

  test(
    "Test#13 - POST /todos (201) max out content",
    { tag: "@post" },
    async ({ request }) => {
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: {
          title: "t".repeat(50),
          doneStatus: false,
          description: "d".repeat(200),
        },
      });
      let json = await createObject.json();
      expect(createObject.status()).toBe(201);
      expect(json).toBeTruthy();
      //to do - сделать expect на количесто символов в title и decription;
    }
  );

  test(
    "Test#14 - POST /todos (413) content too long",
    { tag: "@post" },
    async ({ request }) => {
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: {
          title: "t".repeat(50),
          doneStatus: false,
          description: "d".repeat(5000),
        },
      });
      let errorMessage = await createObject.json();
      expect(createObject.status()).toBe(413);
      expect(errorMessage).toEqual(
        expect.objectContaining({
          errorMessages: [
            "Error: Request body too large, max allowed is 5000 bytes",
          ],
        })
      );
    }
  );

  test(
    "Test#15 - POST /todos (400) extra",
    { tag: "@post" },
    async ({ request }) => {
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: {
          title: "t".repeat(50),
          doneStatus: false,
          description: "d".repeat(200),
          priority: "high",
        },
      });
      let errorMessage = await createObject.json();
      expect(createObject.status()).toBe(400);
      expect(errorMessage).toEqual(
        expect.objectContaining({
          errorMessages: ["Could not find field: priority"],
        })
      );
    }
  );

  test(
    "Test#16 - PUT /todos/{id} (400)",
    { tag: "@post" },
    async ({ request }) => {
      const wrongId = 88;
      //Выполнение теста с полученным id
      const response = await request.put(`${URL}todos/${wrongId}`, {
        headers: {
          "x-challenger": token,
        },
        data: { title: "Put new info", doneStatus: true, description: "Done" },
      });
      let body = await response.json();
      expect(response.status()).toBe(400);
    }
  );

  test(
    "Test#17 - POST /todos/{id} (200)",
    { tag: "@post" },
    async ({ request }) => {
      // Метод создания объекта, чтобы вытащить id для теста
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: { title: "New Object", doneStatus: false, description: "Get ID" },
      });
      let newObject = await createObject.json();
      const objectId = newObject.id;
      //Выполнение теста с полученным id
      const response = await request.post(`${URL}todos/${objectId}`, {
        headers: {
          "x-challenger": token,
        },
        data: {
          title: "Upate by POST methos",
          doneStatus: true,
          description: "Done",
        },
      });
      expect(response.status()).toBe(200);
      expect(
        await response.json({
          todos: [
            {
              id: objectId,
              title: "Upate by POST methos",
              doneStatus: true,
              description: "Done ID",
            },
          ],
        })
      );
    }
  );

  test(
    "Test#18 - POST /todos/{id} (404)",
    { tag: "@post" },
    async ({ request }) => {
      const wrongId = 88;
      //Выполнение теста с полученным id
      const response = await request.post(`${URL}todos/${wrongId}`, {
        headers: {
          "x-challenger": token,
        },
        data: { title: "Put new info", doneStatus: true, description: "Done" },
      });
      let errorMessage = await response.json();
      expect(response.status()).toBe(404);
      expect(errorMessage).toEqual(
        expect.objectContaining({
          errorMessages: ["No such todo entity instance with id == 88 found"],
        })
      );
    }
  );

  test(
    "Test#19 - POST /todos/{id} (200)",
    { tag: "@post" },
    async ({ request }) => {
      // Метод создания объекта, чтобы вытащить id для теста
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: { title: "New Object", doneStatus: false, description: "Get ID" },
      });
      let newObject = await createObject.json();
      const objectId = newObject.id;
      //Выполнение теста с полученным id
      const response = await request.put(`${URL}todos/${objectId}`, {
        headers: {
          "x-challenger": token,
        },
        data: { title: "Put new info", doneStatus: true, description: "Done" },
      });
      expect(response.status()).toBe(200);
      expect(
        await response.json({
          todos: [
            {
              id: objectId,
              title: "Put new info",
              doneStatus: true,
              description: "Done ID",
            },
          ],
        })
      );
    }
  );

  test(
    "Test#20 - PUT /todos/{id} partial (200)",
    { tag: "@put" },
    async ({ request }) => {
      // Метод создания объекта, чтобы вытащить id для теста
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: { title: "New Object", doneStatus: false, description: "Get ID" },
      });
      let newObject = await createObject.json();
      const objectId = newObject.id;
      //Выполнение теста с полученным id
      const response = await request.put(`${URL}todos/${objectId}`, {
        headers: {
          "x-challenger": token,
        },
        data: {
          title: "Change only title",
        },
      });
      expect(response.status()).toBe(200);
      expect(
        await response.json({
          todos: [
            {
              id: objectId,
              title: "Change only title",
              doneStatus: true,
              description: "Done ID",
            },
          ],
        })
      );
    }
  );

  test(
    "Test#21 - PUT /todos/{id} no title (400)",
    { tag: "@put" },
    async ({ request }) => {
      // Метод создания объекта, чтобы вытащить id для теста
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: { title: "New Object", doneStatus: false, description: "Get ID" },
      });
      let newObject = await createObject.json();
      const objectId = newObject.id;
      //Выполнение теста с полученным id
      const response = await request.put(`${URL}todos/${objectId}`, {
        headers: {
          "x-challenger": token,
        },
        data: {
          doneStatus: false,
          description: "Get ID",
        },
      });
      let errorMessage = await response.json();
      expect(response.status()).toBe(400);
      expect(errorMessage).toEqual(
        expect.objectContaining({
          errorMessages: ["title : field is mandatory"],
        })
      );
    }
  );

  test(
    "Test#22 - PUT /todos/{id} no amend id (400)",
    { tag: "@put" },
    async ({ request }) => {
      // Метод создания объекта, чтобы вытащить id для теста
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: { title: "New Object", doneStatus: false, description: "Get ID" },
      });
      let newObject = await createObject.json();
      let objectId = newObject.id;

      //Выполнение теста с полученным id
      const response = await request.put(`${URL}todos/${objectId}`, {
        headers: {
          "x-challenger": token,
        },
        data: {
          id: 99,
          doneStatus: false,
          description: "Get ID",
        },
      });
      let errorMessage = await response.json();
      expect(response.status()).toBe(400);
      expect(errorMessage).toEqual(
        expect.objectContaining({
          errorMessages: ["Can not amend id from 11 to 99"],
        })
      );
    }
  );

  test(
    "Test#23 - DELETE /todos/{id} (200)",
    { tag: "@delete" },
    async ({ request }) => {
      // Метод создания объекта, чтобы вытащить id
      const createObject = await request.post(`${URL}todos`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: { title: "New Object", doneStatus: false, description: "Get ID" },
      });
      let newObject = await createObject.json();
      let objectId = newObject.id;
      // удаление объекта
      const response = await request.delete(`${URL}todos/${objectId}`, {
        headers: {
          "x-challenger": token,
        },
      });
      expect(response.status()).toBe(200);
      // проверка после удаления
      const checkDeleted = await request.get(`${URL}todos/${objectId}`, {
        headers: {
          "x-challenger": token,
        },
      });
      let errorMessage = await checkDeleted.json();
      expect(checkDeleted.status()).toBe(404);
      expect(errorMessage).toEqual(
        expect.objectContaining({
          errorMessages: ["Could not find an instance with todos/12"],
        })
      );
    }
  );

  test(
    "Test#24 - OPTIONS /todos (200)",
    { tag: "@options" },
    async ({ request }) => {
      const response = await request.fetch(`${URL}todos`, {
        method: "OPTIONS",
        headers: { "x-challenger": token },
      });
      expect(response.status()).toBe(200);
      expect((await response.headers())["allow"]).toBeDefined();
    }
  );

  test(
    "Test#25 - GET /todos (200) XML",
    { tag: "@get" },
    async ({ request }) => {
      let response = await request.get(`${URL}todos`, {
        headers: {
          "x-challenger": token,
          accept: "application/xml",
        },
      });
      const body = await response.text();
      expect(response.status()).toBe(200);
      expect((await response.headers())["content-type"]).toContain(
        "application/xml"
      );
      expect(body).toMatch(/<todos>/);
    }
  );

  test(
    "Test#26 - GET /todos (200) JSON",
    { tag: "@get" },
    async ({ request }) => {
      let response = await request.get(`${URL}todos`, {
        headers: {
          "x-challenger": token,
          accept: "application/json",
        },
      });
      let jsonBody = await response.json();
      expect(response.status()).toBe(200);
      expect(Array.isArray(jsonBody.todos)).toBeTruthy();
    }
  );

  test(
    "Test#27 - GET /todos (200) ANY",
    { tag: "@get" },
    async ({ request }) => {
      let response = await request.get(`${URL}todos`, {
        headers: {
          "x-challenger": token,
          accept: "*/*",
        },
      });
      let jsonBody = await response.json();
      expect(response.status()).toBe(200);
      expect(Array.isArray(jsonBody.todos)).toBeTruthy();
    }
  );

  test(
    "Test#28 - GET /todos (200) XML pref",
    { tag: "@get" },
    async ({ request }) => {
      let response = await request.get(`${URL}todos`, {
        headers: {
          "x-challenger": token,
          accept: "application/xml, application/json",
        },
      });
      const body = await response.text();
      expect(response.status()).toBe(200);
      expect((await response.headers())["content-type"]).toContain(
        "application/xml"
      );
      expect(body).toMatch(/<todos>/);
    }
  );

  test(
    "Test#29 - GET /todos (200) no accept",
    { tag: "@get" },
    async ({ request }) => {
      let response = await request.get(`${URL}todos`, {
        headers: {
          "x-challenger": token,
          accept: "",
        },
      });
      const jsonBody = await response.json();
      expect(response.status()).toBe(200);
      expect((await response.headers())["content-type"]).toContain(
        "application/json"
      );
      expect(Array.isArray(jsonBody.todos)).toBeTruthy();
    }
  );

  test("Test#30 - GET /todos (406)", { tag: "@get" }, async ({ request }) => {
    let response = await request.get(`${URL}todos`, {
      headers: {
        "x-challenger": token,
        accept: "application/gzip",
      },
    });
    const errorMessage = await response.json();
    expect(response.status()).toBe(406);
    expect(errorMessage).toEqual(
      expect.objectContaining({
        errorMessages: ["Unrecognised Accept Type"],
      })
    );
  });

  test("Test#31 - POST /todos XML", { tag: "@post" }, async ({ request }) => {
    const xmlPayload = `<todo><title>XML Task</title><doneStatus>false</doneStatus><description>Test</description></todo>`;
    const response = await request.post(`${URL}todos`, {
      headers: {
        "x-challenger": token,
        "Content-Type": "application/xml",
        Accept: "application/xml",
      },
      data: xmlPayload,
    });
    const body = await response.text();
    expect(response.status()).toBe(201);
    expect((await response.headers())["content-type"]).toContain(
      "application/xml"
    );
    expect(body).toMatch(/<title>XML Task<\/title>/);
  });

  test("Test#32 - POST /todos JSON	", { tag: "@post" }, async ({ request }) => {
    const jsonPayload = {
      title: "New test 32",
      doneStatus: true,
      description: "",
    };
    const response = await request.post(`${URL}todos`, {
      headers: {
        "x-challenger": token,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      data: jsonPayload,
    });
    const body = await response.json();
    const objectId = body.id;
    expect(response.status()).toBe(201);
    expect((await response.headers())["content-type"]).toContain(
      "application/json"
    );
    expect(
      await response.json({
        todos: [
          {
            id: objectId,
            title: "New test 32",
            doneStatus: true,
            description: "",
          },
        ],
      })
    );
  });

  test("Test#33 - POST /todos (415)	", { tag: "@post" }, async ({ request }) => {
    const jsonPayload = {
      title: "New test 32",
      doneStatus: true,
      description: "",
    };
    const response = await request.post(`${URL}todos`, {
      headers: {
        "x-challenger": token,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      data: jsonPayload,
    });
    const body = await response.json();
    expect(response.status()).toBe(415);
    expect(body).toEqual(
      expect.objectContaining({
        errorMessages: [
          "Unsupported Content Type - application/x-www-form-urlencoded",
        ],
      })
    );
  });

  test(
    "Test#34 - GET /challenger/guid (existing X-CHALLENGER)",
    { tag: "@get" },
    async ({ request }) => {
      const response = await request.get(`${URL}challenger/${token}`, {
        headers: { "x-challenger": token },
      });
      const body = await response.json();
      expect(response.status()).toBe(200);
      expect(body).toHaveProperty("challengeStatus");
      expect(body.xChallenger).toEqual(token);
    }
  );

  test(
    "Test#35 - PUT /challenger/guid RESTORE)",
    { tag: "@put" },
    async ({ request }) => {
      const getJson = await request.get(`${URL}challenger/${token}`, {
        headers: { "x-challenger": token },
      });
      const data = await getJson.json();
      const response = await request.put(`${URL}challenger/${token}`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: data,
      });
      const body = await response.json();
      expect(response.status()).toBe(200);
      expect(body).toHaveProperty("challengeStatus");
      expect(body.xChallenger).toEqual(token);
    }
  );

  test(
    "Test#36 - PUT /challenger/{guid} CREATE (200)",
    { tag: "@put" },
    async ({ request }) => {
      //Create guid
      const newResponse = await request.post(`${URL}challenger`);
      const oldGuid = newResponse.headers()["x-challenger"];

      const getResponse = await request.get(`${URL}challenger/${oldGuid}`, {
        headers: { "x-challenger": oldGuid },
      });
      const data = await getResponse.json();

      // Восстанавливаем прогресс с использованием текущего токена
      const response = await request.put(`${URL}challenger/${oldGuid}`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: data,
      });
      const body = await response.json();
      expect(response.status()).toBe(200);
      expect(body.xChallenger).toEqual(oldGuid);
    }
  );

  test(
    "Test#37 - GET /challenger/database/{guid} (200)",
    { tag: "@get" },
    async ({ request }) => {
      const response = await request.get(`${URL}challenger/database/${token}`, {
        headers: { "x-challenger": token },
      });
      const body = await response.json();
      expect(response.status()).toBe(200);
      expect(body).toHaveProperty("todos");
    }
  );

  test(
    "Test#38 - PUT /challenger/database/{guid} (204)",
    { tag: "@put" },
    async ({ request }) => {
      const todosPayload = {
        todos: [
          { id: 1, title: "New 1", doneStatus: false, description: "" },
          { id: 2, title: "New 2", doneStatus: true, description: "" },
        ],
      };
      const response = await request.put(`${URL}challenger/database/${token}`, {
        headers: { "x-challenger": token, "Content-Type": "application/json" },
        data: todosPayload,
      });
      expect(response.status()).toBe(204);
    }
  );

  test(
    "Test#39 - POST /todos XML to JSON (201)",
    { tag: "@post" },
    async ({ request }) => {
      const xmlPayload = `<todo><title>XML to JSON</title><doneStatus>true</doneStatus><description></description></todo>`;
      const response = await request.post(`${URL}todos`, {
        headers: {
          "x-challenger": token,
          "Content-Type": "application/xml",
          Accept: "application/json",
        },
        data: xmlPayload,
      });
      const body = await response.json();
      expect(response.status()).toBe(201);
      expect((await response.headers())["content-type"]).toContain(
        "application/json"
      );
      expect(body.title).toBe("XML to JSON");
    }
  );

  test(
    "Test#40 - POST /todos JSON to XML (201)",
    { tag: "@post" },
    async ({ request }) => {
      const response = await request.post(`${URL}todos`, {
        headers: {
          "x-challenger": token,
          "Content-Type": "application/json",
          Accept: "application/xml",
        },
        data: { title: "JSON to XML", doneStatus: true, description: "" },
      });
      const body = await response.text();
      expect(response.status()).toBe(201);
      expect((await response.headers())["content-type"]).toContain(
        "application/xml"
      );
      expect(body).toMatch(/<title>JSON to XML<\/title>/);
    }
  );

  test(
    "Test#41 - DELETE /heartbeat (405)",
    { tag: "@delete" },
    async ({ request }) => {
      const response = await request.delete(`${URL}heartbeat`, {
        headers: {
          "x-challenger": token,
        },
      });
      expect(response.status()).toBe(405);
    }
  );
});
