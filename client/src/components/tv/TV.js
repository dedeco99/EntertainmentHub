import React, { Component } from "react";
import { withStyles } from "@material-ui/styles";
import PropTypes from "prop-types";
import Grid from "@material-ui/core/Grid";
import Fab from "@material-ui/core/Fab";
import Button from "@material-ui/core/Button";
import Modal from "@material-ui/core/Modal";

import Sidebar from "../.partials/Sidebar";
import SeriesDetail from "./SeriesDetail";
import Episodes from "./Episodes";
import Search from "./Search";
import Banners from "./Banners";

import { getSeries, getSeasons, getPopular, addSeries, editSeries, deleteSeries } from "../../api/tv";

import loadingGif from "../../img/loading3.gif";

import { tv as styles } from "../../styles/TV";

import { withRouter } from "react-router";
import { parseQuery, stringifyQuery } from "../../utils/utils";

class TV extends Component {
	constructor() {
		super();
		this.state = {
			series: [],
			seasons: [],
			episodes: [],
			popular: [],

			currentSeries: "all",
			allPage: 0,
			allHasMore: false,
			popularPage: 0,
			popularHasMore: false,
			episodeFilter: "all",

			showSearchBlock: false,
			showPopularBlock: false,
			showEpisodesBlock: false,
			showModal: false,

			loadingSeries: false,
			loadingPopular: false,
			loadingAll: false,

			queryObj: {},
		};

		this.getAll = this.getAll.bind(this);
		this.getSeasons = this.getSeasons.bind(this);
		this.getEpisodes = this.getEpisodes.bind(this);
		this.filterEpisodes = this.filterEpisodes.bind(this);

		this.getPopular = this.getPopular.bind(this);

		this.addSeries = this.addSeries.bind(this);
		this.editSeries = this.editSeries.bind(this);
		this.deleteSeries = this.deleteSeries.bind(this);

		this.handleShowSearchBlock = this.handleShowSearchBlock.bind(this);
		this.handleShowPopularBlock = this.handleShowPopularBlock.bind(this);
		this.handleShowAllBlock = this.handleShowAllBlock.bind(this);
		this.handleShowModal = this.handleShowModal.bind(this);
		this.handleHideModal = this.handleHideModal.bind(this);
	}

	async componentDidMount() {
		await this.getSeries();
		this.applyUrlFilters();
	}

	applyUrlFilters() {
		const { location } = this.props;
		const query = parseQuery(location.search);
		if (query.series) {
			if (query.season) {
				this.getSeasons(query.series, parseInt(query.season, 10));
			} else {
				this.getSeasons(query.series);
			}
		}

		this.setState({ queryObj: query });
	}

	updateUrlFilter(queryObj) {
		const { location, history } = this.props;
		history.replace({
			pathname: location.pathname,
			search: stringifyQuery(queryObj),
		});
	}

	updateSeriesPath(series) {
		const { queryObj } = this.state;
		queryObj.series = series;
		this.setState({ queryObj });
		this.updateUrlFilter(queryObj);
	}

	updateSeasonPath(season) {
		const { queryObj } = this.state;
		queryObj.season = season;
		this.setState({ queryObj });
		this.updateUrlFilter(queryObj);
	}

	async getSeries() {
		this.setState({ loadingSeries: true });

		const response = await getSeries();

		this.setState({ loadingSeries: false, series: response.data });
	}

	async getAll() {
		const { episodes, allPage, episodeFilter, loadingAll } = this.state;

		if (!loadingAll) {
			this.setState({ loadingAll: true });

			const response = await getSeasons("all", allPage, episodeFilter);

			const newEpisodes = allPage === 0 ? response.data : episodes.concat(response.data);

			this.setState({
				episodes: newEpisodes,
				currentSeries: "all",
				allPage: allPage + 1,
				allHasMore: !(response.data.length < 50),
				showSearchBlock: false,
				showPopularBlock: false,
				showEpisodesBlock: true,
				loadingAll: false,
			});
		}
	}

	async getSeasons(series, selectSeason) {
		const response = await getSeasons(series);

		if (response.data.length) {
			this.updateSeriesPath(series);

			this.setState(
				{ seasons: response.data, currentSeries: series, allPage: 0 },
				() => this.getEpisodes(selectSeason >= 0 ? selectSeason : response.data[response.data.length - 1]._id),
			);
		}
	}

	getEpisodes(season) {
		const { seasons } = this.state;

		const foundSeason = seasons.find(s => s._id === season);

		if (foundSeason) {
			this.updateSeasonPath(season);

			this.setState({
				episodes: foundSeason.episodes,
				showSearchBlock: false,
				showPopularBlock: false,
				showEpisodesBlock: true,
			});
		}
	}

	async getPopular() {
		const { popular, popularPage, loadingPopular } = this.state;

		if (!loadingPopular) {
			this.setState({ loadingPopular: true });

			const response = await getPopular(popularPage);

			const newPopular = popularPage === 0 ? response.data : popular.concat(response.data);

			this.setState({
				popular: newPopular,
				popularPage: popularPage + 1,
				popularHasMore: !(response.data.length < 20),
				showSearchBlock: false,
				showPopularBlock: true,
				showEpisodesBlock: false,
				loadingPopular: false,
			});
		}
	}

	async addSeries(series) {
		const response = await addSeries(series);

		if (response.status < 400) {
			this.setState(prevState => ({
				series: [...prevState.series, response.data].sort((a, b) => (
					a.displayName <= b.displayName ? -1 : 1
				)),
			}));
		}
	}

	async editSeries(id, series) {
		const response = await editSeries(id, series);

		if (response.status < 400) {
			this.setState(prevState => ({
				series: [...prevState.series.filter(s => s._id !== response.data._id), response.data]
					.sort((a, b) => a.displayName <= b.displayName ? -1 : 1),
			}));
		}
	}


	async deleteSeries(e) {
		const { series } = this.state;

		const response = await deleteSeries(e.target.id);

		if (response.status < 400) {
			const updatedSeries = series.filter(s => s._id !== response.data._id);

			this.setState({ series: updatedSeries });
		}
	}

	handleShowSearchBlock() {
		this.setState({ showSearchBlock: true, showPopularBlock: false, showEpisodesBlock: false });
	}

	handleShowPopularBlock() {
		this.setState({
			popular: [],
			popularPage: 0,
			popularHasMore: false,
			showSearchBlock: false,
			showPopularBlock: true,
			showEpisodesBlock: false,
		}, this.getPopular);
	}

	handleShowAllBlock() {
		this.setState({
			episodes: [],
			allPage: 0,
			allHasMore: false,
			showSearchBlock: false,
			showPopularBlock: false,
			showEpisodesBlock: true,
		}, this.getAll);
	}

	handleShowModal(e, type) {
		const { search, popular, series } = this.state;

		if (type === "edit") {
			this.setState({
				currentSeries: series.find(s => s._id === e.target.id),
				showModal: true,
			});
		} else {
			let found = search.find(s => s.id.toString() === e.target.id);
			if (!found) found = popular.find(s => s.id.toString() === e.target.id);

			this.setState({
				currentSeries: found,
				showModal: true,
			});
		}
	}

	handleHideModal() {
		this.setState({ showModal: false });
	}

	filterEpisodes(filter) {
		this.setState({ episodeFilter: filter, episodes: [] });

		this.handleShowAllBlock();
	}

	renderButtons() {
		const { classes } = this.props;
		const { loadingPopular, loadingAll } = this.state;

		return (
			<div align="center">
				<Fab
					onClick={this.handleShowSearchBlock}
					variant="extended"
					size="medium"
					className={classes.searchBtn}
				>
					<i className="material-icons">{"search"}</i>
					{"Search"}
				</Fab>
				<Button
					onClick={this.handleShowPopularBlock}
					className={`outlined-button ${classes.outlinedBtn}`}
					variant="outlined"
					fullWidth
				>
					{loadingPopular ? <img src={loadingGif} height="25px" alt="Loading..." /> : "Popular"}
				</Button>
				<Button
					onClick={this.handleShowAllBlock}
					className={`outlined-button ${classes.outlinedBtn}`}
					variant="outlined"
					fullWidth
				>
					{loadingAll ? <img src={loadingGif} height="25px" alt="Loading..." /> : "All"}
				</Button>
			</div>
		);
	}

	renderContent() {
		const {
			currentSeries,
			series,
			seasons,
			episodes,
			popular,
			allHasMore,
			popularHasMore,
			showSearchBlock,
			showPopularBlock,
			showEpisodesBlock,
			queryObj,
		} = this.state;

		if (showSearchBlock) {
			return (
				<Search
					allSeries={series}
					addSeries={this.addSeries}
				/>
			);
		} else if (showPopularBlock) {
			return (
				<Banners
					series={popular}
					getMore={this.getPopular}
					hasMore={popularHasMore}
					allSeries={series}
					addSeries={this.addSeries}
				/>
			);
		} else if (showEpisodesBlock) {
			return (
				<Episodes
					currentSeries={currentSeries}
					seasons={seasons}
					episodes={episodes}
					selectedSeason={parseInt(queryObj.season, 10)}
					getEpisodes={this.getEpisodes}
					getAll={this.getAll}
					allHasMore={allHasMore}
					filterEpisodes={this.filterEpisodes}
				/>
			);
		}

		return <div />;
	}

	render() {
		const { loadingSeries, series, currentSeries, showModal, queryObj } = this.state;

		const menuOptions = [
			{ displayName: "Edit", onClick: e => this.handleShowModal(e, "edit") },
			{ displayName: "Delete", onClick: this.deleteSeries },
		];

		return (
			<Grid container spacing={2}>
				<Grid item sm={3} md={2}>
					{this.renderButtons()}
					<Sidebar
						options={series}
						idField="_id"
						action={this.getSeasons}
						menu={menuOptions}
						loading={loadingSeries}
						noResultsMessage={"No series"}
						initialSelected={queryObj.series}
					/>
				</Grid>
				<Grid item sm={9} md={10} lg={10}>
					{this.renderContent()}
				</Grid>
				<Modal
					open={showModal}
					onClose={this.handleHideModal}
				>
					<SeriesDetail
						series={currentSeries._id ? currentSeries : {}}
						editSeries={this.editSeries}
					/>
				</Modal>
			</Grid>
		);
	}
}

TV.propTypes = {
	classes: PropTypes.object.isRequired,
	location: PropTypes.object.isRequired,
	history: PropTypes.object.isRequired,
};

export default withStyles(styles)(withRouter(TV));
