/**//**//**//**//**//**//**
 * 标准JS辅助程序
 */

//The common jQuery AJAX request
function sendJsonRequest(type, url, params, data, success, failure) {
	var protocol = window.location.protocol;
    var host = window.location.host;
    var targetUrl = protocol + "//" + host + url;
	if (params != null) {
		targetUrl += "?" + jQuery.param(params)
	}
	$.ajax({
		type: type,
		url: targetUrl,
		timeout: 120000,
		cache: false,
		data: $.toJSON(data),
		processData: false,
		dataType: "text",
		contentType: "application/json; charset=utf-8"
	}).done(function(response) {
//	     console.log('success with response as ' + response);
		var result = undefined;
		if (response != null && response.length > 0) {
			try {
				result = $.secureEvalJSON(response);
			}
			catch(err) {
				result = response;
			}
		}
		success(result);
	}).fail(function(jqXHR) {
//	    console.log('failure with response as ' + jqXHR.responseText);
		var error = undefined;
		if (jqXHR.readyState === 4) {
		    if (jqXHR.status >= 500) {
		        try {
		            error = $.secureEvalJSON(jqXHR.responseText);
		        }
		        catch(err) {
		            error = {msg:"服务器未知错误！"};
		        }
		    }
		    else if (jqXHR.status >= 400) {
		    	if (jqXHR.getResponseHeader("Session-Status") == 'timeout') {
		    		error = {msg:"会话已超时！"};
		    		window.location.href = getWebPath();
		    	} else {
		    		error = {msg:"服务器拒绝访问！"};
		    	}
		    }
		    else if (jqXHR.status >= 300) {
		        var reloc = jqXHR.getResponseHeader("Location");
		        if (reloc != undefined || reloc != '') {
		            window.location = reloc;
		        }
		        else {
		            error = {msg:"数据访问失败！"};
		        }
		    }
		}
		else {
		    error = {msg:"服务器连接失败！"};
		}
		failure(error);
	});
}

function sendRequest(type, url, params, success, failure) {
	var protocol = window.location.protocol;
    var host = window.location.host;
    var targetUrl = protocol + "//" + host + url;
	if (params != null) {
		targetUrl += "?" + jQuery.param(params)
	}
	$.ajax({
		type: type,
		url: targetUrl,
		timeout: 120000,
		cache: false,
		dataType: "text"
	}).done(function(response) {
//	    console.log('success with response as ' + response);
		var result = undefined;
		if (response != null && response.length > 0) {
			try {
				result = $.secureEvalJSON(response);
			}
			catch(err) {
				result = response;
			}
		}
		success(result);
	}).fail(function(jqXHR) {
		var error = undefined;
//		console.log('failure with response as ' + jqXHR.responseText);
		if (jqXHR.readyState === 4) {
            if (jqXHR.status >= 500) {
                try {
                    error = $.secureEvalJSON(jqXHR.responseText);
                }
                catch(err) {
                    error = {msg:"服务器未知错误！"};
                }
            }
            else if (jqXHR.status >= 400) {
            	if (jqXHR.getResponseHeader("Session-Status") == 'timeout') {
		    		error = {msg:"会话已超时！"};
		    		window.location.href = getWebPath();
		    	} else {
		    		error = {msg:"服务器拒绝访问！"};
		    	}
            }
            else if (jqXHR.status >= 300) {
                var reloc = jqXHR.getResponseHeader("Location");
                if (reloc != undefined || reloc != '') {
                    window.location = reloc;
                }
                else {
                    error = {msg:"数据访问失败！"};
                }
            }
        }
        else {
            error = {msg:"服务器连接失败！"};
        }
		failure(error);
	});
}

//获取QueryString的数组
function getQueryString() {
	var result = location.search.match(new RegExp("[\?\&][^\?\&]+=[^\?\&]+","g"));
	if (result == null) {
		return "";
	}
	for ( var i = 0; i < result.length; i++) {
		result[i] = result[i].substring(1);
	}
	return result;
}

//根据QueryString参数名称获取值
function getQueryStringByName(name) {
     var result = location.search.match(new RegExp("[\?\&]" + name+ "=([^\&]+)","i"));
     if(result == null || result.length < 1){
         return "";
     }
     return result[1];
}

//根据QueryString参数索引获取值
function getQueryStringByIndex(index) {
     if(index == null){
         return "";
     }
     var queryStringList = getQueryString();
     if (index >= queryStringList.length){
         return "";
     }
     var result = queryStringList[index];
     var startIndex = result.indexOf("=") + 1;
     result = result.substring(startIndex);
     return result;
}

/**
 *  页面DIV渲染执行器
 *  STYLE缺省为并行渲染
 */
function divRenderer(element) {
    divRender(element, function callback() {
        // no operation yet
    });
}

function divRender(div, callback) {
    if (div == undefined || div == null) {
        callback();
        return;
    }
//    window.console.log('div processing ', div.id);
    if (div.url == undefined || div.url == null) {
        if (div.style == 'series') {
            divSeriesRender(div.child);
        }
        else {
            divParallelRender(div.child);
        }
    }
    else {
        sendRequest("GET", div.url, div.params, function(response) {
//            window.console.log('div rendering ', div.id);
            $('#'+div.id).html(response);
            if (div.style == 'series') {
                divSeriesRender(div.child);
            }
            else {
                divParallelRender(div.child);
            }
            callback();
        }, function(err) {
            renderWarning(div.id, err.msg);
            callback();
        });
    }
}

function divSeriesRender(divs) {
    if (divs == undefined || divs == null || divs.length == 0)
        return;
    var currDiv = divs[0];
//    window.console.log('series processing ', currDiv.id);
    divRenderer(currDiv, new function callback() {
//        window.console.log('callback by ', currDiv.id);
        divs.shift();
        divSeriesRender(divs);
    });
}

function divParallelRender(divs) {
    if (divs == undefined || divs == null || divs.length == 0)
        return;
    for (var idx = 0; idx < divs.length; idx++) {
        var currDiv = divs[idx];
//        window.console.log('parallel processing ', currDiv.id);
        divRenderer(currDiv, new function callback() {
            // leave blank as no operation
//            window.console.log('callback by ', currDiv.id);
        });
    }
}

function renderInfo(divId, infoMsg) {
    var info = '<div class="alert alert-info">'+infoMsg+'</div>';
    $('#'+divId).html(info);
}

function renderWarning(divId, warningMsg) {
	   var warning = '<div style="height:120px;line-height:100px;text-align:center;width:500px;margin-left:30%;">'+
 		'<img style="float:left;margin-top:10px" src="../images/dataFailure.png">'+
 		'<span style="width:400px;float:left;font-size:30px;font-weight:bold;font-family:微软雅黑;color:#C43833;">'+warningMsg+'</span>'+
 		'</div>';
    $('#'+divId).html(warning);
}