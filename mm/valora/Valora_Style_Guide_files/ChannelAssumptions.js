module.exports.ChannelAssumptions = function (objectTemplate, getTemplate)
{

	var Product = getTemplate('static/product.js').Product;

	var productCodes = {};
	productCodes[Product.channels.Valora.code] = {
		Term: Product.products.ValoraTerm.code,
		Rop:  Product.products.ValoraROP.code
	};

	// Empty file for channels that don't have specific assumptions
	return {
		ChannelAssumptions: {
            channelAssumptions: 'valora',
			channelCodes: keyBy('code', Product.channelCodes),
			productCodes: productCodes,
			productTypeCodes: keyBy('code', Product.productTypeCodes)
        }
	}

	function keyBy(code, data) {
		var res = {};
		_.each(data, function (elem, key) {
			res[key] = elem.code;
		});
		return res;
	}
};
