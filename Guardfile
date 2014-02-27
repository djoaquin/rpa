require "bootstrap-sass"

# # OPTIONS
opts = {
  "coffeescript"=> {
    # hide_success: true,
    input:  '_coffee',
    output: 'js'},
  "sass"=> {
    input:  '_scss',
    output: 'css'}}


guard 'coffeescript', opts["coffeescript"]
guard 'sass', opts["sass"]

guard 'livereload' do
  watch(%r{.+(html|coffee|scss)})
end

guard 'jekyll' do
  watch %r{.*}
  ignore %r{public}
end
