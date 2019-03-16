import React, { Component } from "react";
import { connect } from "react-redux";

import { getYoutubeChannels, getYoutubePosts } from "../../store/actions/youtubeActions";

import Sidebar from "../.partials/Sidebar";
import Posts from "./Posts";

class Youtube extends Component {
  componentDidMount() {
    this.props.getChannels(this.props.auth.uid);
  }

  getPosts = (channel) => {
    this.props.getPosts(channel, this.props.auth.uid)
  }

  render() {
    const { channels, posts } = this.props;

    return (
      <div className="youtube">
        <div className="row">
          <div className="col-sm-3 col-md-2 col-lg-2">
            <Sidebar options={ channels } getPosts={ this.getPosts } />
          </div>
          <div className="col-sm-9 col-md-10 col-lg-10">
            <Posts posts={ posts } />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    auth: state.firebase.auth,
    channels: state.youtube.channels,
    posts: state.youtube.posts
  }
}

const mapDispatchToProps = (dispatch) => {
	return {
    getChannels: (userId) => dispatch(getYoutubeChannels(userId)),
		getPosts: (channel, userId) => dispatch(getYoutubePosts(channel, userId))
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(Youtube);
