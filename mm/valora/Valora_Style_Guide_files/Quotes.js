module.exports.Quotes = function (objectTemplate, getTemplate)
{
	var CapitalNeeds = getTemplate('./needs/CapitalNeeds.js').CapitalNeeds;
	var Applicant = getTemplate('./customer/Person.js').Applicant;
	var Assumptions = getTemplate('./static/Assumptions.js').Assumptions;
	var Insurers = getTemplate('./static/Insurers.js').Insurers;
	var HavenQuotes = getTemplate('./static/HavenQuotes.js').HavenQuotes;
	var Utils = getTemplate('./Utils.js').Utils;
	var QuoteEngine = getTemplate('QuoteEngine.js', {app: 'lib/quotesengine', client:false}).QuoteEngine;



	// Non-Semotus modules
    var http;
    if (typeof(require) != "undefined") {
        http = require('http');
		fs = require('fs');
		var testMode = (objectTemplate.config.nconf.get('environment ') != 'production') ? objectTemplate.config.nconf.get('test') || '' : '';
	}

var Quotes = objectTemplate.create("Quotes", // not really persistent
{
	quotes:          {isLocal: true, type: Object, value: {}},
	previousQuote:   {isLocal: true, type: Object, value: null},
	currentQuoteKey: {isLocal: true, type: String, value: ""},
	filteredQuotes:  {isLocal: true, type: Object, value: {}},

	hlQuotesJson: 	{toClient: false, toServer: false, type: Object},

	getQuote: function (showError, brand, options) {
		if (!this.quoted) {
			this.quoted = true;
			this.quote = this.doGetQuote(brand, options);
		}
		return this.quote && this.quote.error && !showError ? null : this.quote;
	},
	compute: function () {
		this.quoted = false;
	},

	/**
	 * Get quote data from the cache or from the server.  In the case where we have to go out to the server
	 * return the previous quote as a placeholder so screen doesn't blink
	 *
     * Options -
	 * @param face - primary customer's face
     * @param overTime - array of 5 year periods and amount needed if death occurs there
     * @param term - primary customer's maximum term
     * @param applicant - Applicant
     */
	doGetQuote: function(brand, options)
	{
		// Gather data for both quotes
		var primaryFace = options.face;

		// Setup the spec
		var quoteSpec = [];
		var overTime = options.overTime;
		var quoteKey = "";
		if (primaryFace > 0)
			quoteKey += this.pushQuoteSpec(quoteSpec, options.applicant, primaryFace, overTime[0].data,
				options.term, options.state, brand) + options.applicant.healthClass;

		// If no insurance needed
		if (primaryFace == 0)
			return null;//{customers: [], costs: [{cost: 0}],  ladderLifetime: 0, singleLifetime: 0, savings: 0};

		// See if we have it already in cache and if so we process it
		if (this.quotes[quoteKey] && this.quotes[quoteKey] != "pending") {
			if (typeof(this.quotes[quoteKey]) == 'string')
				return {error: this.quotes[quoteKey]};
			if (this.currentQuoteKey != quoteKey)
				this.findLowestQuote(this.quotes[quoteKey]);
			this.currentQuoteKey = quoteKey;
			return this.freshenQuotes(this.quotes[quoteKey]);
		}

		// If we are in the middle of getting a quote just wait
		if (this.quotes[quoteKey] == "pending")
			return (this.previousQuote && !primaryFace) ? this.freshenQuotes(this.previousQuote) : null;

		// Fetch the quote and install it in the quotes cache
		this.quotes[quoteKey] = "pending";
		var self = this;

        this.fetchQuotes(quoteSpec).then(
            function(quotes){
				if (quotes == null) {
					self.quotes[quoteKey] = "Quotes not available for that amount and years";
				} else {
					self.quotes[quoteKey] = self.structureQuotes(quotes, brand);
					self.previousQuote = self.quotes[quoteKey];
				}
			},
			function(error) {
				self.quotes[quoteKey] =
				{customers: [], costs: [],  ladderLifetime: 0, singleLifetime: 0,
					savings: 0, error: error.message};
                console.log('COMPULIFE ' + error.message);
			}
			// Note that the controller.getQuote schedules a refresh
		);

		return this.previousQuote ? this.freshenQuotes(this.previousQuote) : null;
	},
	/**
	 * Get a structure that quote engine can use to return quotes and a string representing
	 * search criteria that can be used to cache the results
	 *
	 * @param quoteSpec - array to push into
	 * @param applicant - customer whom quote is for
	 * @param cashFlow - cashflow to get total insurance needed
	 * @param overTime - array of 5 year periods and amount needed if death occurs there
	 * @param term - maximum term needed by client
	 * @return cache key string
	 */
	pushQuoteSpec: function(quoteSpec, applicant, face, overTime, term, state, brand)
	{
		// Determine variance in coverage over time to see if it is worth laddering
        var terms = [];
        if (Assumptions.doLaddering) {
            var amount = overTime[0];
            var max = amount;
            var variance = 0
            for (var ix = 0; ix < overTime.length; ix += 5) {
                variance = Math.max(variance, Math.abs(overTime[ix] - amount));
                amount = overTime[ix];
                max = Math.max(max, amount);
            }

            // Create array represents time periods each with a pair of quotes representing a ladder
            for (var ix = 0; ix < term; ix += 5)
                // First element of array represents non-ladder
                if (ix == 0 || (variance > 0 && (overTime[ix] > 0) && ((face - overTime[ix]) > 0)))
                    if (ix == 0)
                // [full-term, coverage at that point], [years to that point, additional coverage]
                        terms.push([[term, ix == 0 ? max : overTime[ix]], [ix, face - overTime[ix]]]);
        } else
            terms.push([[term, face],[0, 0]]);
		// Create the quote spec (Some of these redundant items are to get a stringified key sans customer)
		var quote = {
			face: face,
			term: terms,
			brand: brand,
			customerUnique: this.getQuotesQueryString(applicant, 500000, 20),
			state: state
		};
		quoteSpec.push(quote);
		var str = JSON.stringify(quote);
		quote.customer = applicant;
		return str;
	},
	/**
	 * Convert raw quotes into ordered candidates of singleton or ladder pairs
	 * sorted in order of price
	 *
	 * @param customers
	 * @return {Object}
	 */

	structureQuotes: function(customers, brand)
	{
        var useSelectedHealthClass = true; // We are using a defined health class rather than matching on health questions

		// Remove quotes that are unavailable
		function rank (healthClass) {
			return customers[0].customer.healthRank[healthClass];
		}
		for (var cix = 0; cix < customers.length; ++cix) {
		    var carrier = {};
			for (var tix = 0; tix < customers[cix].quotes.length; ++tix) {
				var healthClass = customers[cix].customer.healthClass;
				for (var lix = 0; lix < customers[cix].quotes[tix].length; ++lix) {
					var ladder = customers[cix].quotes[tix][lix];
					for (var qix = 0; qix < ladder.quote.length; ++qix) {
						var quote = ladder.quote[qix];

						// Remove other brands if exclusive
						if (brand && quote.logo && !brand.match(quote.logo.replace(/\..*/, ''))) {
							ladder.quote.splice(qix, 1);
							qix --
						}

						// Remove maybes that are below your imputed class
						else if (quote.available == 'No' || (
                            (useSelectedHealthClass || quote.available == 'Maybe') && (rank(quote.healthClass) > rank(healthClass)))) {
							ladder.quote.splice(qix, 1)
							--qix;
						} else {
							// Remove lower classes for same carrier/face/term
							var key = quote.logo + ":" + ladder.face + ":" + ladder.term;
							if (carrier[key] && rank(quote.healthClass) <= rank(carrier[key])) {
								ladder.quote.splice(qix, 1)
								--qix;
							} else
								carrier[key] = quote.healthClass;
						}
					}
					/*
					while (ladder.quote.length > 3)
						ladder.quote.splice(ladder.quote.length - 1, 1);
					*/
				}
			}
		}
		// Generate all permutations
		var permutations = [];
		for (var cix = 0; cix < customers.length; ++cix) {

			// Sort out monthly prices when monthly not quoted
			for (var tix = 0; tix < customers[cix].quotes.length; ++tix)
				for (var lix = 0; lix < customers[cix].quotes[tix].length; ++lix) {
					var ladder = customers[cix].quotes[tix][lix];
					for (var qix = 0; qix < ladder.quote.length; ++qix) {
						var monthly = ladder.quote[qix].monthly.replace(/,/, '');
						var annual = ladder.quote[qix].annual.replace(/,/, '');
						ladder.quote[qix].monthly = (isNaN(monthly) || monthly == 0) ?
							(isNaN(annual) ? 0 : annual /12) :	monthly * 1;
						ladder.quote[qix].annual = annual * 1;
						//ladder.quote[qix].monthly = (isNaN(annual) || annual == 0) ?
						//	(isNaN(monthly) ? 0 : monthly * 1) : annual /12;
					}
				}

			permutations.push({customer: customers[cix].customer, quotes: []}); //terms

			// Go through long end of ladder and add in other quotes
			if (customers[cix].quotes.length)
				for (var qix = 0; qix < customers[cix].quotes[0][0].quote.length; ++qix)
					permutations[cix].quotes.push (
						{
							policies: [
								{
									term: customers[cix].quotes[0][0].term,
									face: customers[cix].quotes[0][0].face,
									quote: customers[cix].quotes[0][0].quote[qix]
								}
							]
						}
					);

			permutations.nonLaddered = permutations.length;

			// Look at each term combination
			for (var tix = 1; tix < customers[cix].quotes.length; ++tix)
			{
				// Extrapolate each combination of long and short end of the ladder
				for (var qix1 = 0; qix1 < customers[cix].quotes[tix][0].quote.length; ++qix1)

					for (var qix2 = 0; qix2 < customers[cix].quotes[tix][1].quote.length; ++qix2)
						permutations[cix].quotes.push (
							{
								policies:  [
									{
										term: customers[cix].quotes[tix][0].term,
										face: customers[cix].quotes[tix][0].face,
										quote: customers[cix].quotes[tix][0].quote[qix1]
									},
									{
										term: customers[cix].quotes[tix][1].term,
										face: customers[cix].quotes[tix][1].face,
										quote: customers[cix].quotes[tix][1].quote[qix2]
									}
								]
							}
						);
			}
		}
		var quote = {customers: permutations};
		return quote;
	},
	freshenQuotes: function (quote) {
		var options = ""
		if (options != quote.options)
			this.findLowestQuote(quote);
		return quote;
	},
	/**
	 * Order quotes such that they are a mix of laddered and non-laddered sorting by total cost
	 * and compute the total premiums over the legs of the ladder.
	 *
	 * @param quote
	 * @return {*}
	 */
	findLowestQuote: function (quote)
	{
		// Leave trail of options config
		var options = ""
		quote.options = options;

		var singleCost = 0;
		var ladderCost = 0;
		var term = 0;
		var customers = quote.customers;

		for (var cix = 0; cix < customers.length; ++cix)
		{
			var customer = customers[cix];
			// Look at each term combination and compute total cost
			for (var qix = 0; qix < customer.quotes.length; ++qix) {

				// Look at the two legs of the ladder for the term, enrich and total
				var total = 0;
				var quotes = customer.quotes[qix];
				var policies = quotes.policies;
				for (var pix = 0; pix < policies.length; ++pix)
				{
					var policy = policies[pix];
					policy.monthly = policy.quote.monthly;
					policy.annual = policy.quote.annual;
					policy.logo = policy.quote.logo;
					policy.fee = policy.quote.fee * 1;
                    policy.carrierCode = policy.quote.logo.replace(/\..*/, '');
					policy.optionsCost = 0;
					policy.totalMonthly = policy.monthly + policy.optionsCost;
					policy.lifeCost = (policy.term * policy.monthly * 12) + //(quote.term * quote.fee) +
						(policy.term * policy.optionsCost * 12);
					total += policy.lifeCost;
				}
				quotes.lifeCost = total;
			}

			// Compute various metrics
			customer.lowest = {singleMonthly:99999999999, singleTotal: 99999999999, ladderMonthly: 99999999999,
				               ladderTotal: 99999999999};
			function isLowest (point, amount) {
				if (customer.lowest[point] > amount)
					customer.lowest[point] = amount;
			}
			for (var lix = 0; lix < customer.quotes.length; ++lix) {

				var ladder = customer.quotes[lix];
				var policies = ladder.policies;

				ladder.costs = policies.length == 1 ?
					[ {start: 1, end:  policies[0].term, cost: policies[0].totalMonthly} ] :
					[ {start: 1, end:  policies[1].term, cost: policies[0].totalMonthly + policies[1].totalMonthly },
					  {start: policies[1].term + 1, end:  policies[0].term, cost: policies[0].totalMonthly }];


				if (policies.length == 1) {
					isLowest('singleMonthly', ladder.policies[0].monthly);
					isLowest('singleTotal', ladder.lifeCost);
				} else {
					isLowest('ladderMonthly', ladder.policies[0].monthly + ladder.policies[1].monthly);
					isLowest('ladderTotal', ladder.lifeCost);
				}

			}

			// Kill ladders that are more expensive than lowest single in terms of lifetime or monthly costs

			for (var lix = 0; lix < customer.quotes.length; ++lix) {
				var ladder = customer.quotes[lix];
				var policies = ladder.policies;
				if (policies.length == 2 &&
					((ladder.policies[0].monthly + ladder.policies[1].monthly) > customer.lowest.singleMonthly ||
					  ladder.lifeCost > customer.lowest.singleTotal))
				{
					customer.quotes.splice(lix, 1);
					lix--
				}
			}

			// Peel off non-laddered
			var singlePolicies = [];
			while(customer.quotes[0] && customer.quotes[0].policies.length == 1) {
				singlePolicies.push(customer.quotes[0])
				customer.quotes.splice(0, 1);
			}
			singlePolicies.sort(function(a, b) {return b.policies[0].monthly - a.policies[0].monthly});

			//customer.quotes.sort(function(a, b) {return a.lifeCost - b.lifeCost});
			//customer.quotes.splice(200);
			customer.quotes.sort(function(a, b) {
				return (a.policies[0].monthly + a.policies[1].monthly) -
					   (b.policies[0].monthly + b.policies[1].monthly)});

			// Insert single policies at front
			for (var pix = 0; pix < singlePolicies.length; ++pix)
				customer.quotes.splice(0, 0, singlePolicies[pix]);

			//customer.quotes.sort(function(a, b) {return a.policies[0].monthly - b.policies[0].monthly});
			//customer.quotes.sort(function(a, b) {return a.policies[0].quote.carrier > b.policies[0].quote.carrier ? 1 : -1});
			// Find lowest cost
			var lowestCost = 99999999999;
			var lowestSingle = 9999999999;

			// Compute the cost of each quote over time
			for (var lix = 0; lix < customer.quotes.length; ++lix) {

				var ladder = customer.quotes[lix];
				var policies = ladder.policies;

				// Determine lowest total cost term combination
				//@@@ Added && policies.length == 1 to filter out ladders for now
				if (ladder.lifeCost < lowestCost && policies.length == 1) {
					customer.selectedPolicy = lix;
					lowestCost = ladder.lifeCost;
				}
				if (policies.length == 1 && ladder.lifeCost < lowestSingle)
					lowestSingle = ladder.lifeCost;

			}

			// Look at each term combination
			for (var qix = 0; qix < customer.quotes.length; ++qix) {
				var quotes = customer.quotes[qix];
				if (quotes.policies.length > 1)
					quotes.savings = Math.max(0,
						(lowestSingle - quotes.lifeCost) / lowestSingle);
			}

		}
		quote.term = 0;
		for (cix = 0; cix < customers.length; ++cix)
			quote.term = customers[cix].quotes.length > 0 ? Math.max(customers[cix].quotes[0].policies[0].term, quote.term) : 0;

		return quote;
	},
	filterQuotes: function (incomingQuotes, max, index, type, complaintLevel, paymentPerformanceLevel,
	                        ratingLevel, brandSelection)
	{
		var filterKey = this.currentQuoteKey + max.toString() + index.toString() + type +
						complaintLevel.toString() + paymentPerformanceLevel.toString() +
					    ratingLevel.toString() + JSON.stringify(brandSelection);
		if (this.filteredQuotes[filterKey])
			return this.filteredQuotes[filterKey];
		var returnQuotes = [];

		if(!incomingQuotes || !incomingQuotes.customers || incomingQuotes.customers.length == 0){
			return returnQuotes;
		}
		var customer = incomingQuotes.customers[index];
		var ladderCount = 0;

		// Find lowest cost policy in filter
		customer.lowest = {singleMonthly:99999999999, singleTotal: 99999999999,
						   ladderMonthly: 99999999999, ladderTotal: 99999999999};
		function isLowest (point, amount) {
			if (customer.lowest[point] > amount)
				customer.lowest[point] = amount;
		}

		// Look at each term combination and compute total cost
		for (var qix = 0; qix < customer.quotes.length; ++qix) {
			var include = true;
			var ladder = customer.quotes[qix];
			var policies = ladder.policies;
			var brandMatch = false;
			for (var pix = 0; pix < policies.length && include; ++pix)
			{
				var policy = policies[pix];
				var company = policy.logo.replace(/\..*/, '');
				var insurer = Insurers.companies[company];
				if (insurer && (brandSelection.All.value || brandSelection[company].value))
					brandMatch = true;
				if (insurer)
				{
					var rating = Insurers.ratingsLevel[insurer.rating];
					policy.insurer = insurer;
					policy.carrier = insurer.fullName;
					policy.shortName = insurer.shortName;
					policy.rating = insurer.rating;
					policy.unsettled = insurer.unsettled;
					policy.complaints = insurer.complaintIndex;
					if (rating < ratingLevel ||
						insurer.complaintIndex >= 0 && insurer.complaintIndex >= complaintLevel ||
						insurer.unsettled >= 0 && insurer.unsettled >= paymentPerformanceLevel ||
						type == 'nonconvertible' && insurer.convertible ||
						type == 'convertible' && !insurer.convertible)

						include = false;
				} else
					include = false;
			}
			if (!brandMatch)
				include = false;
			if (policies.length == 1) {
				isLowest('singleMonthly', ladder.costs[0].cost);
				isLowest('singleTotal', ladder.lifeCost);
			} else {
				isLowest('ladderMonthly', ladder.costs[0].cost);
				isLowest('ladderTotal', ladder.lifeCost);
			}
			if (include && !(type != 'ladder' && policies.length > 1 ||
						     type == 'ladder' && policies.length == 1))
			{
				returnQuotes.push(ladder);
				if (policies.length > 1)
					++ladderCount;
			}
		}
		// Look at each term combination
		for (var qix = 0; qix < customer.quotes.length; ++qix) {
			var quotes = customer.quotes[qix];
			if (quotes.policies.length > 1)
				quotes.savings = Math.max(0,
					(customer.lowest.singleTotal - quotes.lifeCost) / customer.lowest.singleTotal);
		}
		returnQuotes.splice(max);
		this.filteredQuotes[filterKey] = returnQuotes;
		return returnQuotes;
	},
	/**
	 * Aggregate the costs across customers
	 *
	 * @return {*}
	 */
	getSelectedQuote: function(customers)
	{

		var quote = {customers: customers}
		// Calculate the term segments to get price map over time
		var costs = [];
		for (var yix = 0; yix < quote.term / 5; ++yix)
			costs[yix] = {cost: 0, term: 5};

		// Walk through each 5 year term segment
		for (var yix = 0; yix < quote.term / 5; ++yix)
			for (var pix = 0; pix < customers.length; ++pix) {
				var policies = customers[pix].policies;
				for (var lix = 0; lix < policies.length; ++lix) {
					var step =  policies[lix];
					if (yix * 5 < step.term)
						costs[yix].cost += step.totalMonthly;
				}
			}

		// Squash redundant terms
		for (var yix = 0; yix < costs.length; ) {
			if (yix > 0 && costs[yix - 1].cost == costs[yix].cost) {
				costs[yix - 1].term += 5
				costs.splice(yix, 1)
			} else
				++yix
		}
		var start = 1;
		for (var yix = 0; yix < costs.length; ++yix) {
			costs[yix].start = start;
			costs[yix].end = start + costs[yix].term - 1;
			start = costs[yix].end + 1;
		}

		quote.costs = costs;

		return quote;
	},
	getQuotesQueryString: function(applicant, face, term, healthQuote) {

		var compulifeClasses = {"P+":"PP", "Pf":"P", "R+":"RP", "Rg":"R", "P+S":"PP", "PfS":"P", "R+S":"RPS", "RgS":"R"};

		if (applicant.person.dob)
			var date = applicant.person.dob;
		else {
			var date = new Date();
			date.setFullYear(date.getFullYear() - applicant.person.age);
		}
		var cat = term <= 1 ? 1 : term <= 5 ? 2 : term <= 10 ? 3 :	term <= 15 ? 4 : term <= 20 ? 5 :
			term <= 25 ? 6 : term <= 30 ? 7 : '0';
		var currentlyUseTobacco = (applicant.smoker || applicant.healthClass.match(/S$/));
		var wasSmoker = false;
		return "" +

			(
			"Smoker=" + (currentlyUseTobacco ? 'Y' : 'N') + '&' +
			"CqsComparison=+Click+Here&" +
			"State=" + Assumptions.stateCode[applicant.address.state || 'MA'] + "&" +
			"BirthMonth=" + (date.getMonth() + 1) + "&" +
			"Birthday=" + date.getDate() + "&" +
			"BirthYear=" + date.getFullYear() + "&" +
			((applicant.overrideAmount && !healthQuote) ? "Health=" + compulifeClasses[applicant.healthClass] + "&" : "Health=PP&") +
			"FaceAmount=" + face + "&" +
			"Sex=" + (applicant.gender == "male" ? 'M' : 'F') + "&" +
			"Smoker=" + (currentlyUseTobacco ? 'Y' : 'N') + '&' +
			"Category=" + cat + "&" +
	    	"TEMPLATEFILE=JSON.HTM&" +
			"HTEMPLATEFILE=JSONH.HTM&" +
			"ZipCode=&" +
			"SortOverride1=N&" +
			"ModeUsed=M&" +
			"GoColor=Yes&" +
			"NoGoColor=No&" +
			"DoNotKnowColor=Maybe&" +
			"GoString=NoIdea&" +
			"NoGoString=NoIdea&" +
			"DoNotKnowString=NoIdea&" +
			"SortByHealth=OFF&" +
			"RejectReasonBr=OFF&" +
			"GoMessage=CGISucks&" +
			"DoNotKnowMessage=CGISucks&" +
			"NoRedX=ON"
             );
	},


	quoteCache: {},
	fetchProductQuote: function (filteredQuotes, quoteKey, gender, healthClass, smoker, age, term, face) {
		var cacheString = quoteKey + gender + healthClass + smoker + age + term + face;
		if (this.quoteCache[cacheString]) {
			allQuotes = this.addHavenQuote(this.quoteCache[cacheString], filteredQuotes);
			return allQuotes;
		}
		if (this.quoteCache["inprogress"] && this.quoteCache["inprogress"] == cacheString) return [];
		else {
			this.quoteCache["inprogress"] = cacheString;
			this.fetchProductQuoteOnServer(quoteKey, gender, healthClass, smoker == "yes", age, term, face).then(function (response) {
				delete this.quoteCache["inprogress"];
				if (response) {
					allQuotes = this.addHavenQuote(response, filteredQuotes);
					this.quoteCache[cacheString] = response;
					controller.refresh();
				}
			}.bind(this));
			return [];
		}
	},
	addHavenQuote: function (havenQuote, filteredQuotes) {
		var quoteDataStructure = {};
		quoteDataStructure['costs'] = [{cost: havenQuote.policies[0].monthly}];
		quoteDataStructure['policies'] = havenQuote.policies;

		var allQuotes = filteredQuotes.slice(0, filteredQuotes.length);
		allQuotes.splice(0, 0, quoteDataStructure);

		return allQuotes;
	},
	fetchProductQuoteOnServer: {
		on: "server",
		body: function (quoteKey, gender, healthClass, smoker, age, term, face) {
			options = {
				product: quoteKey,
				gender: gender,
				healthClass: healthClass,
				smoker: smoker,
				age: age + 0,
				term: term + 0,
				face: face + 0
			};


			var quotesEngine = new QuoteEngine();

			return quotesEngine.getQuote(options).then(function (response) {
				return response;
			})
		}
	},



	fetchHavenQuote: function(product, gender, healthClass, smoker, age, term, face){ // SecReviewed
		options = {
			product: product,
			gender: gender,
			healthClass: healthClass,
			smoker: smoker == "yes",
			age: age + 0,
			term: term + 0,
			face: face + 0
		};


		var quotesEngine = new QuoteEngine();

		return quotesEngine.getQuoteSync(options);
	},
    fetchQuotes: {on: "server",  // SecReviewed
        body: function(quoteSpec) {
			if (testMode.match(/noquote/)) {
				return Q([]);
			}
            var isWin = /^win/.test(process.platform);
            var isMac = process.platform.match(/darwin/);

            if (!isMac && !isWin) // Only on *nix
                return this.fetchQuotesLocal(quoteSpec);

            var startTime = process.hrtime();

            // Create a query string the compulife engine will recognize
            var query = "";
            var quoteCount = 0;
            for (var ix = 0; ix < quoteSpec.length; ++ix) {
                for (var jx = 0; jx < quoteSpec[ix].term.length; ++jx) {
                    var terms = quoteSpec[ix].term[jx];
                    for (var kx = 0; kx < 2; ++kx) {
                        var face = terms[kx][1];
                        var term = terms[kx][0];
                        var date = new Date(quoteSpec[ix].dob);
                        if (face > 0) {
                            query += this.getQuotesQueryString(quoteSpec[ix].customer, face, term) + ";";
                            quoteCount += 1;
                        }
                    }
                }
            }
            // Fetch quotes and parse them into results structure.  The quote server returns an array
            // of quotes where each sequential pair of rows represents a quote for the spec element
            // and each quote is actually an array of companies and thier prices
            query = query.substr(0, query.length -1); // strip final ;
            var self = this;
            console.log(query);
            var request = require('request');
            var options = {
                uri: 'http://compulife.coverpath.com/cgi-bin/cpquote2',
                body: query,
                headers: {
                    'origin' : 'http://coverpath.com',
                    'content-type': 'text/plain'
                }
            }

            return Q.ninvoke(request, "post", options).then(
                function(response){
                    var diff = process.hrtime(startTime);
                    var took = (diff[0] * 1e9 + diff[1]) / 1000000;
                    console.log("Getting quotes from webserver " + took + ': getting quotes ' + ix + '-' + jx);
                    //console.log(response[0].body.toString());
                    var fu = response[0].body.toString();
                    fu = "[" + fu.substr(0, fu.length - 4) + ']]';
                    //console.log(fu);
                    try{
                        var quotes = [];
                          var results = JSON.parse(fu);

                        var rix = 0;
                        for (var six = 0; six < quoteSpec.length; ++six) { // really the primary/alternate customer
                            quotes[six] = {customer: quoteSpec[six].customer, quotes: []};
                            var qix = 0;
                            for (var tix = 0; tix < quoteSpec[six].term.length; ++tix) {
                                var terms = quoteSpec[six].term[tix];
                                var isLadder = terms[1][1] > 0;

                                // Make sure we have results and if not that we increment over results properly
                                if (results[rix].length > 0) { // have 1st half ?
                                    if (isLadder) {  // Is there a 2nd half?
                                        if (results[rix + 1].length > 0) {  // do we have the 2nd half ?
                                            // Record both halves of the ladder
                                            quotes[six].quotes[qix] =
                                                [
                                                    {quote: results[rix++], term: terms[0][0], face: terms[0][1]}
                                                ];
                                            quotes[six].quotes[qix++][1] =
                                            {quote: results[rix++], term: terms[1][0], face: terms[1][1]};
                                        } else
                                            rix += 2; // Blow off first and 2nd half
                                    } else
                                    // Record only the single quote
                                        quotes[six].quotes[qix++] = [
                                            {quote: results[rix++], term: terms[0][0], face: terms[0][1]}
                                        ];
                                }
                                else // Don't have 1st half so blow off one or two quotes
                                    rix += (isLadder ? 2 : 1);
                            }
                        }
                        return quotes;
                    }
                    catch(e){
                        console.log("Error parsing compulife response " + fu);
                        console.log(fu);
                        throw "Error parsing compulife response";
                    }
                }.bind(this),
            function(error){
                console.log("Error communicating with compulife " + error );
                throw error;
            }.bind(this));
	}},

    fetchQuotesLocal: {on: "server",  // SecReviewed
        body: function(quoteSpec)
    {
        // Create a query string the compulife engine will recognize
        var isWin = /^win/.test(process.platform);
        var promises = [];
        var results = [];
        var startTime = process.hrtime();
        for (var ix = 0; ix < quoteSpec.length; ++ix) {
            results[ix] = [];
            for (var jx = 0; jx < quoteSpec[ix].term.length; ++jx) {
                results[ix][jx] = [];
                var terms = quoteSpec[ix].term[jx];
                for (var kx = 0; kx < 2; ++kx) {
                    var face = terms[kx][1];
                    var term = terms[kx][0];
                    var date = new Date(quoteSpec[ix].dob);
                    if (face > 0) {
                        (function () {
                            var closureIx = ix;
                            var closureJx = jx;
                            var closureKx = kx;
                            var query = this.getQuotesQueryString(quoteSpec[ix].customer, face, term);
                            var spawn = require('child_process').spawn;
                            var deferred = Q.defer();
                            var options = {
                                cwd: __dirname + "/../../../../compulife/cgi-bin",
                                env: {
                                    REQUEST_METHOD: 'GET',
                                    QUERY_STRING: query
                                }
                            }
                            var diff = process.hrtime(startTime);
                            var took = (diff[0] * 1e9 + diff[1]) / 1000000;
                            console.log(took + ': requesting quotes ' + ix + '-' + jx);
                            var quoteProc = isWin ? spawn('cmd', ['/c', 'cqs32.exe'], options) : spawn('cqsl32.cgi', [], options);

						    quoteProc.on('error', function(err) {
						        console.error('Error caught spawning Compulife process: ' + err.stack);
						        deferred.resolve(null);
						    });

                            quoteProc.stderr.on('data', function (data) {
                                console.log('stderr: ' + data);
                                deferred.resolve(null);
                            });

                            var bufs = [];
                            quoteProc.stdout.on('data', function (d) {
                                bufs.push(d);
                            });
                            quoteProc.stdout.on('end', function () {
                                try {
                                    var diff = process.hrtime(startTime);
                                    var took = (diff[0] * 1e9 + diff[1]) / 1000000;
                                    console.log("Getting quotes locally " + took + ': returned quotes ' + ix + '-' + jx);
                                    var qstr = Buffer.concat(bufs).toString();
									if (qstr.match(/No Products are available/)) {
										results[closureIx][closureJx][closureKx] = [];
										deferred.resolve(true);
									}
                                    //console.log(qstr);
                                    var qstr = "[" +
                                        qstr.substr(0, qstr.length - 2)
                                        .substr(qstr.indexOf("{") - 1)
                                        + ']';
                                    //console.log(qstr);
									try {
                                    	results[closureIx][closureJx][closureKx] = JSON.parse(qstr);
									} catch (e) {
										console.log(Buffer.concat(bufs).toString());
										throw e;
									}
                                    deferred.resolve(true);

                                } catch (e) {
                                    deferred.reject(e);
                                }
                            }.bind(this));

                            promises.push(deferred.promise);
                        }.bind(this))()
                    }
                }
            }
        }

        // Fetch quotes and parse them into results structure.  The quote server returns an array
        // of quotes where each sequential pair of rows represents a quote for the spec element
        // and each quote is actually an array of companies and thier prices
        return Q.all(promises).then(
            function(){
                    var quotes = [];
                    for (var six = 0; six < quoteSpec.length; ++six) { // really the primary/alternate customer
                        quotes[six] = {customer: quoteSpec[six].customer, quotes: []};
                        var qix = 0;
                        for (var tix = 0; tix < quoteSpec[six].term.length; ++tix) {
                            var terms = quoteSpec[six].term[tix];
                            var isLadder = terms[1][1] > 0;

                            // Make sure we have results and if not that we increment over results properly
                            if (results[six][tix][0].length > 0) { // have 1st half ?
                                if (isLadder) {  // Is there a 2nd half?
                                    if (results[six][tix][1].length > 0) {  // do we have the 2nd half ?
                                        // Record both halves of the ladder
                                        quotes[six].quotes[qix] =
                                            [
                                                {quote: results[six][tix][0], term: terms[0][0], face: terms[0][1]}
                                            ];
                                        quotes[six].quotes[qix++][1] =
                                        {quote: results[six][tix][1], term: terms[1][0], face: terms[1][1]};
                                    }
                                } else
                                // Record only the single quote
                                    quotes[six].quotes[qix++] = [
                                        {quote: results[six][tix][0], term: terms[0][0], face: terms[0][1]}
                                    ];
                            }
                       }
                    }
                    return quotes;
            }.bind(this),
            function(error){
                console.log("Error communicating with compulife " + error );
            }.bind(this)
        );
    }},
});
return {
	Quotes: Quotes
}
};
