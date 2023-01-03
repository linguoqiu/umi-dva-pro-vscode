# Umi Dva Pro

## 功能

在基于umi框架进行项目开发时，当在组件里面dispatch一个action的时候，只要[ctrl] + [左键]（ mac [command] + [左键] ）点击type里面的值，就会跳转到对应的model里的对应effect或reduce.



## 使用范围

使用Umi搭建的React项目，约定式路由


## 支持格式


	dispatch({ type: "namespace/effectnameOrReduceName", ccc: "ddd" });


	dispatch({ type: "namespace/effectnameOrReduceName"});


	dispatch({       
		type: "namespace/effectnameOrReduceName",
		ccc: "ddd", 
	});
