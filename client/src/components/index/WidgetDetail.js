import React, { Component } from "react";
import { withStyles } from "@material-ui/styles";
import PropTypes from "prop-types";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";

import Input from "../.partials/Input";

import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import Chip from "@material-ui/core/Chip";

import { getCities } from "../../api/weather";
import { getCoins } from "../../api/crypto";

const styles = () => ({
	autocomplete: {
		width: 300,
	},
});

class WidgetDetail extends Component {
	constructor() {
		super();
		this.state = {
			type: "notifications",
			info: {
				subreddit: "",

				city: "",
				country: "",
				lat: 0,
				lon: 0,
			},

			typingTimeout: null,
			cities: [],
			coins: [],
		};

		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleKeyPress = this.handleKeyPress.bind(this);

		this.getCities = this.getCities.bind(this);
		this.selectCity = this.selectCity.bind(this);
		this.getCoins = this.getCoins.bind(this);
		this.selectCoin = this.selectCoin.bind(this);
	}

	getCities(e, filter) {
		const { typingTimeout } = this.state;

		if (!filter) return;

		if (typingTimeout) clearTimeout(typingTimeout);

		const timeout = setTimeout(async () => {
			const response = await getCities(filter);

			if (response.data) {
				this.setState({ cities: response.data });
			}
		}, 500);

		this.setState({ typingTimeout: timeout });
	}

	selectCity(e, city) {
		const { info } = this.state;

		if (!city) return;

		this.setState({
			info: {
				...info,
				city: city.name,
				country: city.country,
				lat: city.lat,
				lon: city.lon,
			},
		});
	}

	getCoins(e, filter) {
		const { typingTimeout } = this.state;

		if (!filter) return;

		if (typingTimeout) clearTimeout(typingTimeout);

		const timeout = setTimeout(async () => {
			const response = await getCoins(filter);

			if (response.data) {
				this.setState({ coins: response.data });
			}
		}, 500);

		this.setState({ typingTimeout: timeout });
	}

	selectCoin(e, coins) {
		const { info } = this.state;

		this.setState({
			info: {
				...info,
				coins: coins.map(coin => coin.symbol).join(","),
			},
		});
	}

	handleChange(e) {
		const { info } = this.state;

		if (e.target.id.includes("info")) {
			this.setState({ info: { ...info, [e.target.id.replace("info.", "")]: e.target.value } });
		} else {
			this.setState({ [e.target.id]: e.target.value });
		}
	}

	async handleSubmit() {
		const { onAdd } = this.props;
		const { type, info } = this.state;

		await onAdd({ type, info });
	}

	handleKeyPress(event) {
		if (event.key === "Enter") this.handleSubmit();
	}

	renderFields() {
		const { classes } = this.props;
		const { type, info, cities, coins } = this.state;

		switch (type) {
			case "reddit":
				return (
					<Input
						id="info.subreddit"
						type="text"
						label="Subreddit"
						value={info.subreddit}
						onChange={this.handleChange}
						onKeyPress={this.handleKeyPress}
						margin="normal"
						variant="outlined"
						fullWidth
						required
					/>
				);
			case "weather":
				return (
					<Autocomplete
						options={cities}
						onInputChange={this.getCities}
						onChange={this.selectCity}
						className={classes.autocomplete}
						getOptionLabel={option => `${option.name}, ${option.country}`}
						renderInput={params => <TextField {...params} label="Cidade" variant="outlined" fullWidth margin="normal" />}
					/>
				);
			case "crypto":
				return (
					<Autocomplete
						multiple
						limitTags={2}
						renderTags={(value, getTagProps) =>
							value.map((option, index) => (
								<Chip label={option.symbol} {...getTagProps({ index })} />
							))
						}
						options={coins}
						onInputChange={this.getCoins}
						onChange={this.selectCoin}
						className={classes.autocomplete}
						getOptionLabel={option => `${option.symbol} - ${option.name}`}
						renderInput={params => <TextField {...params} label="Coins" variant="outlined" fullWidth margin="normal" />}
					/>
				);
			default: return null;
		}
	}

	render() {
		const { open, onClose } = this.props;
		const { type } = this.state;

		return (
			<Dialog
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description"
				open={open}
			>
				<DialogTitle id="simple-dialog-title">{"New Widget"}</DialogTitle>
				<DialogContent>
					<FormControl variant="outlined">
						<InputLabel htmlFor="outlined-age-native-simple">{"Type"}</InputLabel>
						<Select
							native
							label="Type"
							id="type"
							value={type}
							onChange={this.handleChange}
							fullWidth
							required
						>
							<option value="notifications">{"Notifications"}</option>
							<option value="reddit">{"Reddit"}</option>
							<option value="weather">{"Weather"}</option>
							<option value="crypto">{"Crypto"}</option>
							<option value="tv">{"TV"}</option>
						</Select>
					</FormControl>
					{this.renderFields()}
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose} color="primary">
						{"Close"}
					</Button>
					<Button onClick={this.handleSubmit} color="primary" autoFocus>
						{"Add"}
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

WidgetDetail.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onAdd: PropTypes.func.isRequired,
	classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(WidgetDetail);
