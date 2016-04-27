module.exports.product = function (objectTemplate, getTemplate)
{
    if (typeof(require) != 'undefined') {
        _ = require('underscore');
    }

    var branding = {
        Valora:       {name: 'Term Life'},
        Haven:        {name: 'Haven'},
        MM:           {name: 'MassMutual'},
        Cas:          {name: 'Term for CAS'}
    };

    var productTypes = {
        Term:       {name: 'Term Life'},
        WholeLife:  {name: 'Whole Life'},
        ROP:        {name: 'Return of Premium'},
        DI:         {name: 'Disability'}
    };

    var channels = {
        Haven:      {name: 'Haven Life', emailBranding: branding.Haven, fromEmail: 'no-reply@havenlife.com', helpEmail: 'help@havenlife.com', phone: '1-855-744-2836', policyPhone: '1-844-768-6774'},
        Valora:     {name: 'ValoraLife', emailBranding: branding.Valora, fromEmail: 'no-reply@valoralife.com', helpEmail: 'help@valoralife.com', phone: '1-855-220-2333', policyPhone: '1-844-768-6774'},
        CAS:        {name: 'CAS', emailBranding: branding.MM},
        MM:         {name: 'App Taking', emailBranding: branding.MM, helpEmail: 'help@havenlife.com', phone: '1-855-744-2836', policyPhone: '1-844-768-6774'}
    };

    var policyRanges = {
        HavenTerm:      {start: 1100000001, end: 1100250000},
        ValoraTerm:     {start: 1101000001, end: 1101999999},
        ValoraROP:      {start: 1102000001, end: 1102999999},
        CASTerm:        {start: 0, end: 0},
        MMTerm:         {start: 0, end: 0},
        MMWholeLife:    {start: 0, end: 0},
        MMDI:           {start: 0, end: 0}
    };

    var quoteEngineKeys = {
        Haven:      {quoteKey: 'HavenTerm', waiverKey: 'HavenTerm'},
        ValoraTerm: {quoteKey: 'ValoraTerm', waiverKey: 'HavenTerm'},
        ValoraROP:  {quoteKey: 'ValoraROP', waiverKey: 'HavenTerm'},
        CASTerm:    {quoteKey: 'CASTerm', waiverKey: 'CASTerm'},
        MM:         {quoteKey: 'MassMutual', waiverKey: 'MassMutual'}
    };

    var products = {
        HavenTerm:   {name: 'Haven Term', type: productTypes.Term, channel: channels.Haven, policyRange: policyRanges.HavenTerm, quoteKey: quoteEngineKeys.Haven},
        ValoraTerm:  {name: 'ValoraLife Term',  type: productTypes.Term, channel: channels.Valora, policyRange: policyRanges.ValoraTerm, quoteKey: quoteEngineKeys.ValoraTerm},
        ValoraROP:   {name: 'ValoraLife Term Plus', type: productTypes.ROP, channel: channels.Valora, policyRange: policyRanges.ValoraROP, quoteKey: quoteEngineKeys.ValoraROP},
        CASTerm:     {name: 'CAS Term', type: productTypes.Term, channel: channels.CAS, policyRange: policyRanges.CASTerm, quoteKey: quoteEngineKeys.CASTerm},
        MMTerm:      {name: 'Vantage Term', type: productTypes.Term, channel: channels.MM, policyRange: policyRanges.MMTerm, quoteKey: quoteEngineKeys.MM},
        MMWholeLife: {name: 'MM Whole Life', type: productTypes.WholeLife, channel: channels.MM, policyRange: policyRanges.MMWholeLife, quoteKey: quoteEngineKeys.MM},
        MMDI:        {name: 'MM Disability', type: productTypes.DI, channel: channels.MM, policyRange: policyRanges.MMDI, quoteKey: quoteEngineKeys.MM}
    };

    key(products);
    key(branding);
    key(channels);
    key(productTypes);

    _.each(productTypes, function (type) {
        type.productCodes = {};
        _.each(products, function (product, key) {
            if (product.type.code == type.code) {
                type.productCodes[key] = product.code;
            }
        });
    });

    _.each(channels, function (channel) {
        channel.productCodes = {};
        _.each(products, function (product, key) {
            if (product.channel.code == channel.code) {
                channel.productCodes[key] = product.code;
            }
        });
    });

    _.each(channels, function (channel) {
        channel.productTypes = {};
        _.each(productTypes, function (type, typeKey) {
            _.each(type.products, function (product, productKey) {
                if (product.channel.code == channel.code) {
                    channel.productTypes[typeKey] = channel.productTypes[typeKey] ||
                                                    _.extend( _.clone(type), {productCodes: {}});
                    channel.productTypes[typeKey].productCodes[productKey] = product.code;
                }
            });
        });
    });

    return {Product: {
        products: products,
        channels: channels,
        productTypes: productTypes,
        quoteEngineKeys: quoteEngineKeys,
    }};

    function keyBy(code, data) {
        var res = {};
        _.each(data, function (elem, key) {
            res[key] = elem.code;
        });
        return res;
    }
    function keyBy(code, data) {
        var res = {};
        _.each(data, function (elem, key) {
            res[key] = elem.code;
        });
        return res;
    }
    function keyByProp(code, prop, data) {
        var res = {};
        _.each(data, function (elem, key) {
            res[elem[code || key]] = elem.prop;
        });
        return res;
    }
    function key(data) {
        _.each(data, function (elem, key) {
            elem.code = key;
        });
    }
}



