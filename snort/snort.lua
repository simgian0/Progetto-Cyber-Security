
ips = {
  enable_builtin_rules = true,
}

logging = {
  default_logdir = "/var/log/snort",
  alert = {
    file = true,
  },
}

run = {
  detection = {
    enabled = true,
  },
  interface = {
    "any",
  },
}