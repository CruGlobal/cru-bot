local redis = require "resty.redis"
local red = redis:new()

red:set_timeout(1000) -- 1 sec

local env = os.getenv("ENVIRONMENT")
local project_name = os.getenv("PROJECT_NAME")
local ok, err = red:connect(os.getenv("REDIS_PORT_6379_TCP_ADDR"), 6379)
if not ok then
    ngx.log(ngx.ERR, "failed to connect: ", err)
    return
end

-- use db number 3
red:select(3)

local res, err = red:get("maintenance:" .. project_name .. ":maintenance")
if not ok then
    ngx.log(ngx.ERR, "failed to get key: ", err)
    return
end

-- put it into the connection pool of size 100,
-- with 10 seconds max idle time
local ok, err = red:set_keepalive(10000, 100)
if not ok then
    ngx.log(ngx.ERR, "failed to set keepalive: ", err)
end

if res == "true" then
    ngx.log(ngx.ERR, "maintenance mode: ", res)
    ngx.log(ngx.ERR, "maintenance:" .. project_name .. ":maintenance")

    -- load maintenance page
    local res = ngx.location.capture("/maintenance.html")
    ngx.header.content_type = "text/html"

    -- Keep ELB health check happy
    if ngx.var.uri == "/monitors/lb" then
      ngx.status = 200
    else
      ngx.status = 503
    end
    ngx.say(res.body)
    ngx.exit(ngx.OK)
end
