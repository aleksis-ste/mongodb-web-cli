<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-6">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-5xl">
      <div v-if="!connected">
        <div
          v-if="errorMessage"
          class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
        >
          {{ errorMessage }}
        </div>
        <div
          v-if="successMessage"
          class="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded"
        >
          {{ successMessage }}
        </div>
        <h1 class="text-2xl font-bold mb-4">MongoDB Connection</h1>
        <input
          v-model="connectionString"
          type="text"
          placeholder="Enter MongoDB Connection String"
          class="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:border-blue-500"
        />
        <button
          @click="handleConnect"
          class="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 focus:outline-none"
        >
          Connect
        </button>
      </div>
      <div v-else>
        <div class="flex justify-between">
          <h1 class="text-2xl font-bold mb-4">MongoDB CLI</h1>
          <button
            @click="handleEndSession"
            class="ml-4 bg-red-500 text-white py-3 px-6 rounded hover:bg-red-600 focus:outline-none"
          >
            End Session
          </button>
        </div>
        <div class="mb-4">
          <label for="database" class="block text-sm font-medium text-gray-700"
            >Select Database:</label
          >
          <select
            id="database"
            v-model="selectedDatabase"
            @change="handleDatabaseChange"
            class="mt-1 block w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option disabled value="">Please select a database</option>
            <option
              v-for="database in databases"
              :key="database"
              :value="database"
            >
              {{ database }}
            </option>
          </select>
        </div>
        <div v-if="collections.length > 0" class="mb-4">
          <h2 class="text-lg font-bold mb-2">Available Collections:</h2>
          <span
            v-for="collection in collections"
            :key="collection"
            class="inline-flex items-center px-3 py-1 mr-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300 transition duration-200"
          >
            {{ collection }}
          </span>
        </div>
        <div v-if="selectedDatabase">
          <div class="relative mb-4">
            <prism-editor
              class="query-editor"
              v-model="query"
              :highlight="highlighter"
              line-numbers
            >
            </prism-editor>
          </div>
          <button
            @click="handleQuery"
            class="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 focus:outline-none"
          >
            Run Query
          </button>
          <div
            v-if="errorMessage"
            class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
          >
            {{ errorMessage }}
          </div>
          <div
            v-if="successMessage"
            class="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded"
          >
            {{ successMessage }}
          </div>
          <pre
            class="mt-4 bg-gray-900 text-white p-4 rounded overflow-auto h-96"
          >
            <code ref="resultOutput" class="language-json"></code>
          </pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="js">
import axios from "axios";
import { PrismEditor } from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css";

import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css";

axios.defaults.withCredentials = true;

export default {
  data() {
    return {
      connectionString: "",
      selectedDatabase: "",
      query: "db.users.find({})",
      results: [],
      connected: false,
      databases: [],
      collections: [],
      errorMessage: "",
      successMessage: "",
    };
  },
  components: {
    PrismEditor,
  },
  mounted() {},
  methods: {
    async handleConnect() {
      this.errorMessage = "";
      this.successMessage = "";
      try {
        const response = await axios.post(
          "http://localhost:5000/databases/connect",
          { connectionString: this.connectionString }
        );
        if (response.data.message === "Connected successfully") {
          this.connected = true;
          await this.fetchDatabases();
          this.successMessage = "Connected successfully";
        }
      } catch (error) {
        this.errorMessage = error.response
          ? error.response.data.error
          : error.message;
      }
    },
    async fetchDatabases() {
      this.errorMessage = "";
      try {
        const response = await axios.get("http://localhost:5000/databases", {
          params: { connectionString: this.connectionString },
        });
        this.databases = response.data;
      } catch (error) {
        this.errorMessage = error.response
          ? error.response.data.error
          : error.message;
      }
    },
    async handleDatabaseChange() {
      this.errorMessage = "";
      this.successMessage = "";
      if (this.selectedDatabase) {
        try {
          const response = await axios.post(
            "http://localhost:5000/databases/select",
            { databaseName: this.selectedDatabase }
          );
          if (response.data.message === "Database selected successfully") {
            this.successMessage = "Database selected successfully";
            await this.fetchCollections();
          }
        } catch (error) {
          this.errorMessage = error.response
            ? error.response.data.error
            : error.message;
        }
      }
    },
    async fetchCollections() {
      try {
        const response = await axios.get('http://localhost:5000/databases/collections');
        this.collections = response.data;
      } catch (error) {
        this.errorMessage = error.response ? error.response.data.error : error.message;
      }
    },
    async handleQuery() {
      this.errorMessage = "";
      this.successMessage = "";
      try {
        const command = this.query;
        const response = await axios.post(
          "http://localhost:5000/databases/query",
          { command }
        );
        this.results = response.data;
        this.highlightResult();
        this.successMessage = "Query executed successfully";
      } catch (error) {
        this.errorMessage = error.response
          ? error.response.data.error
          : error.message;
      }
    },
    async handleEndSession() {
      this.errorMessage = '';
      this.successMessage = '';
      try {
        const response = await axios.post('http://localhost:5000/databases/end-session');
        if (response.data.message === 'Session ended successfully') {
          this.connected = false;
          this.selectedDatabase = '';
          this.query = 'db.users.find({})';
          this.results = [];
          this.databases = [];
          this.successMessage = 'Session ended successfully';
        }
      } catch (error) {
        this.connected = false;
        this.errorMessage = error.response ? error.response.data.error : error.message;
      }
    },
    highlighter(code) {
      return highlight(code, languages.js);
    },
    highlightResult() {
      if (this.$refs.resultOutput) {
        this.$refs.resultOutput.innerHTML = Prism.highlight(
          JSON.stringify(this.results, null, 2),
          Prism.languages.json,
          "json"
        );
      }
    },
  },
};
</script>
<style>
.query-editor {
  background: #2d2d2d;
  color: #ccc;
  height: 150px;
}
</style>
